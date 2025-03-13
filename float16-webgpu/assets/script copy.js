// WebGPULayer encapsulates all WebGPU initialization and compute pipeline setup.
class WebGPULayer {
    constructor() {
        this.device = null;
        this.pipeline = null;
    }

    async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported on this browser.");
        }
        // Request an adapter and device.
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("Failed to get GPU adapter.");
        }
        this.device = await adapter.requestDevice();

        // Inlined WGSL shader code for 4x4 matrix multiplication.
        // The shader reads from matrixA and matrixB, computes the product,
        // and writes the result into matrixC.
        const shaderCode = `
        @group(0) @binding(0) var<storage, read> matrixA : array<f32>;
        @group(0) @binding(1) var<storage, read> matrixB : array<f32>;
        @group(0) @binding(2) var<storage, read_write> matrixC : array<f32>;
  
        @compute @workgroup_size(4, 4, 1)
        fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
            let row : u32 = gid.y;
            let col : u32 = gid.x;
            let index : u32 = row * 4u + col;
            var sum : f32 = 0.0;
            for (var k : u32 = 0u; k < 4u; k = k + 1u) {
                sum = sum + matrixA[row * 4u + k] * matrixB[k * 4u + col];
            }
            matrixC[index] = sum;
        }
      `;

        // Create the shader module and compute pipeline.
        const shaderModule = this.device.createShaderModule({ code: shaderCode });
        this.pipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main',
            },
        });
    }
}

// MatrixMultiplier holds the core logic for matrix multiplication,
// while relying on an instance of WebGPULayer for the GPU-specific tasks.
class MatrixMultiplier {
    constructor(webGPULayer) {
        this.gpu = webGPULayer;
        this.device = webGPULayer.device;
        this.pipeline = webGPULayer.pipeline;
    }

    /**
     * Multiplies two 4x4 matrices (provided as Float32Array of length 16)
     * using GPU compute.
     * @param {Float32Array} A - The first matrix.
     * @param {Float32Array} B - The second matrix.
     * @returns {Promise<Float32Array>} - The resulting matrix.
     */
    async matMul(A, B) {
        if (!(A instanceof Float32Array && B instanceof Float32Array)) {
            throw new Error("Both A and B must be Float32Array.");
        }
        if (A.length !== 16 || B.length !== 16) {
            throw new Error("Both matrices must be 4x4 (length 16).");
        }

        const bufferSize = A.byteLength; // should be 16 floats * 4 bytes each

        // Create GPU buffers for matrixA and matrixB (read-only)
        const matrixABuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(matrixABuffer, 0, A.buffer, A.byteOffset, A.byteLength);

        const matrixBBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(matrixBBuffer, 0, B.buffer, B.byteOffset, B.byteLength);

        // Create the storage buffer for the result matrix (matrixC).
        const matrixCBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // Create a readback buffer to read the computed result.
        const readbackBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

        // Create a bind group for the shader's resource bindings.
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: matrixABuffer } },
                { binding: 1, resource: { buffer: matrixBBuffer } },
                { binding: 2, resource: { buffer: matrixCBuffer } },
            ],
        });

        // Encode commands for the compute pass.
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        // With workgroup_size(4,4,1), one dispatch covers all 16 elements.
        passEncoder.dispatchWorkgroups(1, 1, 1);
        passEncoder.end();

        // Copy the results from matrixCBuffer to the readbackBuffer.
        commandEncoder.copyBufferToBuffer(matrixCBuffer, 0, readbackBuffer, 0, bufferSize);

        // Submit the commands.
        this.device.queue.submit([commandEncoder.finish()]);

        // Wait for the GPU to finish and map the readback buffer for reading.
        await readbackBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = readbackBuffer.getMappedRange();
        const result = new Float32Array(arrayBuffer.slice(0));
        readbackBuffer.unmap();
        return result;
    }
}

// Singleton instance holders.
let webGPULayerInstance = null;
let matrixMultiplierInstance = null;

/**
 * Public async function to perform 4x4 matrix multiplication using WebGPU.
 * @param {Float32Array} A - The first 4x4 matrix.
 * @param {Float32Array} B - The second 4x4 matrix.
 * @returns {Promise<Float32Array>} - The resulting matrix.
 */
async function matMul(A, B) {
    if (!webGPULayerInstance) {
        webGPULayerInstance = new WebGPULayer();
        await webGPULayerInstance.init();
    }
    if (!matrixMultiplierInstance) {
        matrixMultiplierInstance = new MatrixMultiplier(webGPULayerInstance);
    }
    return await matrixMultiplierInstance.matMul(A, B);
}

// Example usage:
(async () => {
    // Define two 4x4 matrices.
    const matrixA = () => {
        return new Float32Array([
            1,  2,  3,  4,
            5,  6,  7,  8,
            9, 10, 11, 12,
           13, 14, 15, 16
        ]);
    }
    const matrixB = () => {
        return new Float32Array([
           16, 15, 14, 13,
           12, 11, 10,  9,
            8,  7,  6,  5,
            4,  3,  2,  1
        ]);
    }

    try {

        for (let i = 0; i < 1000; i++) {
            const result = await matMul(matrixA(), matrixB());
            console.log("Result matrix:", result);
        }
        // Expected output for one multiplication should be the product of the two 4x4 matrices.
    } catch (error) {
        console.error("Matrix multiplication failed:", error);
    }
})();
