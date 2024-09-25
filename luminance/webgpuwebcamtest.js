var cubeTexture;
var video;

function start() {
    const constraints = {
        video: {
            facingMode: "environment",
            width: { ideal: 4096 },
            height: { ideal: 2160 },
            frameRate: { ideal: 60 },
            advanced: [
                { width: 3840, height: 2160 },
                { width: 2560, height: 1440 },
                { width: 1920, height: 1080 }
            ]
        }
    };
        
    
    video = document.querySelector("#videoElement");
    let btnStart = document.querySelector("#btnStart");

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            btnStart.disabled = false;
        })
        .catch(function (err0r) {
            console.log("Something went wrong!");
        });
    }
}

function onBtnStartClick(btn) {
    let video = document.querySelector("#videoElement");
    video.play();

    btn.disabled = true;

    let btnStop = document.querySelector("#btnStop");
    btnStop.disabled = false;

    init();
}

function onBtnStopClick(btn) {
    let video = document.querySelector("#videoElement");
    video.pause();

    btn.disabled = true;

    let btnStart = document.querySelector("#btnStart");
    btnStart.disabled = false;
}


// Clear color for GPURenderPassDescriptor
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

// Vertex data for triangle
// Each vertex has 8 values representing position and color: X Y Z W R G B A

/*
const vertices = new Float32Array([
  0.0,  0.6, 0, 1, 1, 0, 0, 1,
 -0.5, -0.6, 0, 1, 0, 1, 0, 1,
  0.5, -0.6, 0, 1, 0, 0, 1, 1
]);
*/

const verticeeeees = new Float32Array([
    -1.0,  1.0, 0, 1, 1, 0, 0, 1, 0, 0,
   -1.0, -1.0, 0, 1, 0, 1, 0, 1, 0, 1.0,
    1.0, 1.0, 0, 1, 0, 0, 1, 1, 1.0, 0,
    1.0, 1.0, 0, 1, 0, 0, 1, 1, 1.0, 0,
    -1.0, -1.0, 0, 1, 0, 1, 0, 1, 0, 1.0,
    1.0, -1.0, 0, 1, 1, 0.5, 0.75, 1.0, 1.0, 1.0
]);

// Vertex and fragment shaders

const shaders = `
@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_external;

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) fragUV : vec2f,
}

@vertex
fn vertex_main(@location(0) position: vec4f,
               @location(1) color: vec4f,
               @location(2) uv : vec2f) -> VertexOut
{
  var output : VertexOut;
  output.position = position;
  output.color = color;
  output.fragUV = uv;
  return output;
}

//@fragment
//fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
//{
    //return textureSampleBaseClampToEdge(myTexture, mySampler, fragData.fragUV);
    //return fragData.color;
//}

// Hardcoded LUT for R, G, and B (raw values from 0-255)
const lutR = array(
    131.0, 132.0, 133.0, 134.0, 136.0, 137.0, 139.0, 141.0, 143.0, 145.0, 148.0, 150.0, 153.0, 155.0, 157.0, 160.0,
    162.0, 164.0, 166.0, 168.0, 170.0, 172.0, 174.0, 175.0, 176.0, 177.0, 177.0, 178.0, 178.0, 179.0, 180.0, 180.0,
    181.0, 181.0, 182.0, 182.0, 183.0, 184.0, 184.0, 184.0, 185.0, 185.0, 186.0, 186.0, 186.0, 187.0, 187.0, 187.0,
    187.0, 187.0, 187.0, 187.0, 187.0, 187.0, 186.0, 186.0, 186.0, 185.0, 185.0, 184.0, 183.0, 182.0, 181.0, 180.0,
    179.0, 178.0, 177.0, 175.0, 172.0, 169.0, 165.0, 161.0, 157.0, 153.0, 148.0, 143.0, 138.0, 133.0, 127.0, 122.0,
    117.0, 111.0, 106.0, 101.0, 95.0, 90.0, 86.0, 81.0, 77.0, 73.0, 69.0, 66.0, 63.0, 60.0, 58.0, 57.0,
    55.0, 54.0, 53.0, 53.0, 53.0, 54.0, 54.0, 55.0, 57.0, 57.0, 58.0, 60.0, 60.0, 63.0, 64.0, 66.0,
    67.0, 69.0, 70.0, 71.0, 73.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 80.0, 81.0, 81.0, 81.0, 80.0,
    80.0, 80.0, 79.0, 79.0, 79.0, 78.0, 78.0, 77.0, 76.0, 76.0, 75.0, 74.0, 73.0, 73.0, 71.0, 71.0,
    70.0, 69.0, 67.0, 67.0, 66.0, 65.0, 64.0, 63.0, 62.0, 60.0, 60.0, 58.0, 58.0, 57.0, 55.0, 54.0,
    53.0, 52.0, 51.0, 49.0, 48.0, 47.0, 46.0, 45.0, 44.0, 43.0, 42.0, 41.0, 40.0, 39.0, 38.0, 37.0,
    36.0, 36.0, 35.0, 34.0, 33.0, 32.0, 32.0, 31.0, 30.0, 30.0, 28.0, 27.0, 25.0, 24.0, 23.0, 22.0,
    21.0, 20.0, 20.0, 19.0, 18.0, 18.0, 17.0, 16.0, 16.0, 14.0, 14.0, 13.0, 12.0, 11.0, 11.0, 10.0,
    9.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 4.0, 5.0, 7.0, 9.0, 11.0, 13.0, 16.0, 19.0, 21.0, 23.0, 25.0, 27.0, 29.0, 31.0, 33.0, 34.0, 36.0, 37.0, 38.0
);

const lutG = array(
    6.0, 6.0, 5.0, 5.0, 4.0, 4.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 5.0, 7.0, 9.0, 11.0, 14.0, 17.0, 20.0, 23.0, 27.0, 30.0, 34.0, 37.0, 41.0, 45.0, 49.0, 53.0, 58.0, 63.0, 67.0, 71.0, 76.0, 80.0, 84.0, 89.0, 93.0, 97.0, 102.0, 106.0, 110.0, 114.0, 118.0, 122.0, 126.0, 130.0, 133.0, 137.0, 140.0, 143.0, 146.0, 149.0, 151.0, 154.0, 156.0, 158.0, 161.0, 163.0, 165.0, 167.0, 169.0, 170.0, 172.0, 173.0, 174.0, 174.0, 175.0, 175.0, 176.0, 176.0, 176.0, 176.0, 175.0, 175.0, 175.0, 174.0, 174.0, 173.0, 172.0, 172.0, 171.0, 170.0, 169.0, 168.0, 167.0, 166.0, 165.0, 164.0, 163.0, 162.0, 160.0, 158.0, 157.0, 155.0, 153.0, 152.0, 150.0, 148.0, 146.0, 144.0, 142.0, 139.0, 137.0, 135.0, 133.0, 131.0, 128.0, 126.0, 124.0, 121.0, 119.0, 117.0, 114.0, 112.0, 110.0, 108.0, 106.0, 105.0, 104.0, 102.0, 101.0, 100.0, 98.0, 96.0, 95.0, 93.0, 92.0, 90.0, 89.0, 87.0, 85.0, 84.0, 82.0, 80.0, 79.0, 77.0, 75.0, 73.0, 71.0, 70.0, 67.0, 66.0, 65.0, 63.0, 60.0, 60.0, 58.0, 55.0, 54.0, 52.0, 51.0, 49.0, 47.0, 45.0, 44.0, 42.0, 41.0, 39.0, 38.0, 36.0, 35.0, 33.0, 32.0, 31.0, 30.0, 28.0, 27.0, 26.0, 25.0, 24.0, 23.0, 22.0, 21.0, 20.0, 17.0, 14.0, 11.0, 9.0, 7.0, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 4.0, 6.0, 9.0, 11.0, 16.0, 19.0, 23.0, 27.0, 31.0, 36.0, 41.0, 46.0, 51.0, 57.0, 63.0, 67.0, 74.0, 79.0, 85.0, 91.0, 96.0, 102.0, 108.0, 113.0, 118.0, 123.0, 128.0, 133.0, 138.0, 143.0, 148.0, 154.0, 159.0, 165.0, 170.0, 176.0, 181.0, 187.0, 192.0, 198.0, 203.0, 208.0, 213.0, 218.0, 223.0, 227.0, 232.0, 236.0, 240.0, 243.0, 246.0, 249.0
);

const lutB = array(
    114.0, 111.0, 108.0, 105.0, 102.0, 98.0, 93.0, 89.0, 84.0, 79.0, 74.0, 67.0, 63.0, 57.0, 51.0, 45.0, 40.0, 35.0, 30.0, 25.0, 21.0, 17.0, 12.0, 9.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 4.0, 4.0, 4.0, 5.0, 5.0, 5.0, 6.0, 6.0, 7.0, 7.0, 7.0, 7.0, 8.0, 8.0, 8.0, 9.0, 9.0, 9.0, 10.0, 10.0, 11.0, 12.0, 12.0, 13.0, 14.0, 16.0, 17.0, 19.0, 20.0, 21.0, 23.0, 25.0, 27.0, 29.0, 31.0, 33.0, 36.0, 39.0, 41.0, 44.0, 47.0, 51.0, 54.0, 58.0, 62.0, 66.0, 69.0, 73.0, 77.0, 81.0, 84.0, 88.0, 92.0, 96.0, 99.0, 103.0, 107.0, 110.0, 113.0, 117.0, 120.0, 123.0, 126.0, 128.0, 131.0, 133.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 144.0, 145.0, 146.0, 146.0, 147.0, 148.0, 148.0, 149.0, 149.0, 150.0, 150.0, 151.0, 151.0, 151.0, 152.0, 152.0, 153.0, 153.0, 153.0, 154.0, 154.0, 154.0, 154.0, 155.0, 155.0, 155.0, 156.0, 156.0, 156.0, 157.0, 157.0, 157.0, 158.0, 158.0, 158.0, 159.0, 159.0, 159.0, 160.0, 160.0, 161.0, 161.0, 162.0, 162.0, 163.0, 163.0, 164.0, 165.0, 165.0, 168.0, 170.0, 172.0, 175.0, 177.0, 180.0, 183.0, 185.0, 188.0, 191.0, 194.0, 197.0, 199.0, 202.0, 205.0, 207.0, 210.0, 213.0, 215.0, 217.0, 219.0, 220.0, 222.0, 224.0, 226.0, 227.0, 229.0, 231.0, 232.0, 234.0, 236.0, 237.0, 239.0, 240.0, 242.0, 243.0, 245.0, 246.0, 247.0, 248.0, 250.0, 251.0, 252.0, 253.0, 254.0, 254.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 254.0, 254.0, 254.0, 254.0
);

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
    // Sample the texture using the external texture sampling function
    // let sampledColor = textureSampleExternal(myTexture, mySampler, fragData.fragUV);

    // Apply gamma correction to the luminance (assuming luminance is in the green channel)
    // let luminance_gamma_corrected = pow(sampledColor.y, 2.2);

    // Scale luminance to [0, 255] and clamp
    // let clamped_luminance = clamp(luminance_gamma_corrected * 255.0, 0.0, 255.0);

    // Convert to integer index for LUT
    // let index = i32(clamped_luminance);

    // Look up the values from the LUT and normalize them
    // let r_lut = lutR[index] / 255.0;
    // let g_lut = lutG[index] / 255.0;
    // let b_lut = lutB[index] / 255.0;

    // Return the final color with normalized LUT values
    // return fragData.color;
    let sampledColor = textureSampleBaseClampToEdge(myTexture, mySampler, fragData.fragUV);
    let luminance_gamma_corrected = pow(sampledColor.y, 2.2);
    let clamped_luminance = clamp(luminance_gamma_corrected * 255.0, 0.0, 255.0);
    return vec4f(luminance_gamma_corrected, luminance_gamma_corrected,  luminance_gamma_corrected, sampledColor.a);
}

`;

// Main function

async function init() {
  // 1: request adapter and device
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error('Couldn\'t request WebGPU adapter.');
  }

  let device = await adapter.requestDevice();

  // 2: Create a shader module from the shaders template literal
  const shaderModule = device.createShaderModule({
    code: shaders
  });

  // 3: Get reference to the canvas to render on
  const canvas = document.querySelector('#gpuCanvas');
  const context = canvas.getContext('webgpu');

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });

  // 4: Create vertex buffer to contain vertex data
  const vertexBuffer = device.createBuffer({
    size: verticeeeees.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
  device.queue.writeBuffer(vertexBuffer, 0, verticeeeees, 0, verticeeeees.length);

  // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
  const vertexBuffers = [{
    attributes: [{
      shaderLocation: 0, // position
      offset: 0,
      format: 'float32x4'
    }, {
      shaderLocation: 1, // color
      offset: 16,
      format: 'float32x4'
    }, {
        shaderLocation: 2, // uv
        offset: 32,
        format: 'float32x2'
    }],
    arrayStride: 40,
    stepMode: 'vertex'
  }];

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: vertexBuffers
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list'
    },
    layout: 'auto'
  };

  // Create a sampler with linear filtering for smooth interpolation.
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  // 6: Create the actual render pipeline

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

  function frame() {
    // Sample is no longer the active page.
    //if (!pageState.active) return;

    const uniformBindGroup = device.createBindGroup({
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: device.importExternalTexture({
            source: video,
          }),
        },
      ],
    });

    // 7: Create GPUCommandEncoder to issue commands to the GPU
  // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    // 9: Draw
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.end();
    // 10: End frame by passing array of command buffers to command queue for execution
    device.queue.submit([commandEncoder.finish()]);

    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(frame);
    } else {
      requestAnimationFrame(frame);
    }
  }

    if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(frame);
    } else {
        requestAnimationFrame(frame);
    }
}
