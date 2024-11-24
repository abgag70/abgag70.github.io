/**
 * This exists to capture all the events that are thrown out of the worker
 * into the worker. Without this, there would be no communication possible
 * with our project.
 */

let cv2;

// We store the generated HDR fle in the global context as a cv.Mat of 32 float 
// let generatedHdr = null;
let matVectorGlobal = null;
let exposureTimesMatGlobal = null;
let responseGlobal = null;

onmessage = async function(e) {
    switch (e.data.msg) {
        case 'load': {
            // Import Webassembly script
            self.importScripts('/opencv/opencv.js');
            await waitForOpencv(function(success) {
                if (success) postMessage({ msg: e.data.msg })
                else throw new Error('Error on loading OpenCV')
            })
            break;
        }
        case 'generateCameraResponseFunction': {
            const cameraResponseFunc = await generateCameraResponseFunction(e.data.payload);
            postMessage({
                msg:e.data.msg,
                payload: cameraResponseFunc
            });
            break;
        }
        case 'generateHdrWithCrf': {
            self.generatedHdrWithCrf = await generateHdrWithCrf();
            postMessage({
                msg:e.data.msg,
                payload: { 
                    success: true,
                    // generatedHdrArrayBuffer: self.generatedHdrBuffer
                }
            }// , [self.generatedHdrBuffer]
            );
            break;
        }
        case 'generateLuminanceMap': {
            colormap = 'mendacious'; // e.data.payload.colormap;
            let [luminanceMapArrayBuffer, min, max] = await generateLuminanceMap(colormap);
            postMessage({
                msg:e.data.msg,
                payload: { 
                    success: true,
                    min: min,
                    max: max,
                    luminanceMapArrayBuffer: luminanceMapArrayBuffer
                }
            } , [luminanceMapArrayBuffer]
            );
            break;
        }
        default: {
            console.error('Nope!!');
            break;
        }
    }
}

async function generateLuminanceMap(colormap = "mendacious") {
    console.log(self.generatedHdrWithCrf);
    let luminanceMap = new cv2.Mat(
        self.generatedHdrWithCrf.rows,
        self.generatedHdrWithCrf.cols,
        cv2.CV_32F,
        new cv2.Scalar(0.0)
    );
    let channels = new cv2.MatVector();
    cv2.split(self.generatedHdrWithCrf, channels); // Split into R, G, B channels

    const coeffs = [0.2126729, 0.7151522, 0.0721750]; // for R, G, B
    for (let i = 0; i < coeffs.length; i++) {
        const scaledChannel = new cv2.Mat();
        const channel = channels.get(i); // Get the channel

        channel.convertTo(scaledChannel, -1, coeffs[i], 0); // Scale the channel
        cv2.add(luminanceMap, scaledChannel, luminanceMap); // Add to luminance map

        // Delete allocated Mats to prevent memory leaks
        scaledChannel.delete();
        channel.delete();
    }

    console.log(luminanceMap);
    let minMax = cv2.minMaxLoc(luminanceMap);
    console.log("Max Value:", minMax.maxVal);
    console.log("Min Value:", minMax.minVal);

    const luminanceMapArrayBuffer = new ArrayBuffer(luminanceMap.cols * luminanceMap.rows * 4);
    const luminanceMapArrayToSend = new Float32Array(luminanceMapArrayBuffer);

    luminanceMapArrayToSend.set(luminanceMap.data32F);

    // Delete remaining Mats to free memory
    luminanceMap.delete();
    channels.delete();

    return [luminanceMapArrayBuffer, minMax.minVal, minMax.maxVal];
}

// Create a 256x1x3 matrix for the lookup table
const createLUT = (colormap) => {
    const lut = new cv2.Mat(256, 1, cv2.CV_8UC3);    
    let rChannel = [];let gChannel = [];let bChannel = [];

    switch (colormap) {
        case 'mendacious': 
            rChannel = new Uint8Array([131,132,133,134,136,137,139,141,143,145,148,150,153,155,157,160,162,164,166,168,170,172,174,175,176,177,177,178,178,179,180,180,181,181,182,182,183,184,184,184,185,185,186,186,186,187,187,187,187,187,187,187,187,187,186,186,186,185,185,184,183,182,181,180,179,178,177,175,172,169,165,161,157,153,148,143,138,133,127,122,117,111,106,101,95,90,86,81,77,73,69,66,63,60,58,57,55,54,53,53,53,54,54,55,57,57,58,60,60,63,64,66,67,69,70,71,73,75,76,77,78,79,80,80,81,81,81,80,80,80,79,79,79,78,78,77,76,76,75,74,73,73,71,71,70,69,67,67,66,65,64,63,62,60,60,58,58,57,55,54,53,52,51,49,48,47,46,45,44,43,42,41,40,39,38,37,36,36,35,34,33,32,32,31,30,30,28,27,25,24,23,22,21,20,20,19,18,18,17,16,16,14,14,13,12,11,11,10,9,9,8,7,6,5,4,3,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,4,5,7,9,11,13,16,19,21,23,25,27,29,31,33,34,36,37,38]);
            gChannel = new Uint8Array([6,6,5,5,4,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,5,7,9,11,14,17,20,23,27,30,34,37,41,45,49,53,58,63,67,71,76,80,84,89,93,97,102,106,110,114,118,122,126,130,133,137,140,143,146,149,151,154,156,158,161,163,165,167,169,170,172,173,174,174,175,175,176,176,176,176,175,175,175,174,174,173,172,172,171,170,169,168,167,166,165,164,163,162,160,158,157,155,153,152,150,148,146,144,142,139,137,135,133,131,128,126,124,121,119,117,114,112,110,108,106,105,104,102,101,100,98,96,95,93,92,90,89,87,85,84,82,80,79,77,75,73,71,70,67,66,65,63,60,60,58,55,54,52,51,49,47,45,44,42,41,39,38,36,35,33,32,31,30,28,27,26,25,24,23,22,21,20,17,14,11,9,7,5,3,1,0,0,0,0,0,0,0,0,0,1,4,6,9,11,16,19,23,27,31,36,41,46,51,57,63,67,74,79,85,91,96,102,108,113,118,123,128,133,138,143,148,154,159,165,170,176,181,187,192,198,203,208,213,218,223,227,232,236,240,243,246,249]);
            bChannel = new Uint8Array([114, 111, 108, 105, 102, 98, 93, 89, 84, 79, 74, 67, 63, 57, 51, 45, 40, 35, 30, 25, 21, 17, 12, 9, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 12, 12, 13, 14, 16, 17, 19, 20, 21, 23, 25, 27, 29, 31, 33, 36, 39, 41, 44, 47, 51, 54, 58, 62, 66, 69, 73, 77, 81, 84, 88, 92, 96, 99, 103, 107, 110, 113, 117, 120, 123, 126, 128, 131, 133, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 144, 145, 146, 146, 147, 148, 148, 149, 149, 150, 150, 151, 151, 151, 152, 152, 153, 153, 153, 154, 154, 154, 154, 155, 155, 155, 156, 156, 156, 157, 157, 157, 158, 158, 158, 159, 159, 159, 160, 160, 161, 161, 162, 162, 163, 163, 164, 165, 165, 168, 170, 172, 175, 177, 180, 183, 185, 188, 191, 194, 197, 199, 202, 205, 207, 210, 213, 215, 217, 219, 220, 222, 224, 226, 227, 229, 231, 232, 234, 236, 237, 239, 240, 242, 243, 245, 246, 247, 248, 250, 251, 252, 253, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 254, 254, 254, 254]);
            break;
        case 'black-and-white':
            rChannel = Uint8Array.from({ length: 256 }, (_, i) => i);
            gChannel = Uint8Array.from({ length: 256 }, (_, i) => i);
            bChannel = Uint8Array.from({ length: 256 }, (_, i) => i);
            break;
        default:
            console.error('Mistake :(((');
            break;
    }
    
    // Create temporary Mats for each channel
    const rMat = new cv2.Mat(256, 1, cv2.CV_8UC1);
    const gMat = new cv2.Mat(256, 1, cv2.CV_8UC1);
    const bMat = new cv2.Mat(256, 1, cv2.CV_8UC1);

    // Set data for each channel
    rMat.data.set(rChannel);gMat.data.set(gChannel);bMat.data.set(bChannel);

    // Merge channels into the final LUT
    const channels = new cv2.MatVector();
    channels.push_back(rMat);channels.push_back(gMat);channels.push_back(bMat);
    cv2.merge(channels, lut);

    // Clean up temporary matrices
    toTheDumpster([rMat, gMat, bMat, channels]);
    return lut;
};

function getParametersSetFromExifObject(exif) {
    return { // @ts-ignore
        exposureTime: exif['ExposureTime'].value[0] / exif['ExposureTime'].value[1], // @ts-ignore
        fNumber: exif['FNumber'].value[0] / exif['FNumber'].value[1], // @ts-ignore
        isoSpeedRatings: exif['ISOSpeedRatings'].value, // @ts-ignore
        pixelXDimension: exif['Image Width'].value, // @ts-ignore
        pixelYDimension: exif['Image Height'].value, // @ts-ignore
        model: exif['Model'].value[0]
    }
  }

/**
 * This function is to convert again from cv2.Mat to ImageData
 */
function imageDataFromMat(mat) {
    // convert the mat type to cv2.CV_8U
    const img = new cv2.Mat()
    const depth = mat.type() % 8
    const scale =
        depth <= cv2.CV_8S ? 1.0 : depth <= cv2.CV_32S ? 1.0 / 256.0 : 255.0
    const shift = depth === cv2.CV_8S || depth === cv2.CV_16S ? 128.0 : 0.0
    mat.convertTo(img, cv2.CV_8U, scale, shift)

    // convert the img type to cv2.CV_8UC4
    switch (img.type()) {
        case cv2.CV_8UC1:
            cv2.cvtColor(img, img, cv2.COLOR_GRAY2RGBA)
            break
        case cv2.CV_8UC3:
            cv2.cvtColor(img, img, cv2.COLOR_RGB2RGBA)
            break
        case cv2.CV_8UC4:
            break
        default:
            throw new Error(
                'Bad number of channels (Source image must have 1, 3 or 4 channels)'
            )
    }
    const clampedArray = new ImageData(
        new Uint8ClampedArray(img.data),
        img.cols,
        img.rows
    )
    img.delete()
    return clampedArray
}

/**
 * @param {Array<import('../interfaces/interfaces').UploadedImage>} images
 * @param {String} algorithm
 * @returns {Promise}
 */
async function generateCameraResponseFunction(images, algorithm = 'debevec') {
    /** @type {Array<Promise<any>>} */
    let cvMatPromiseArray = [];
    /** @type {Array<number>} */
    let exposureTimesArray = [];

    images.forEach(image => {
        cvMatPromiseArray.push(fileToMat(image.image));
        exposureTimesArray.push(
            getParametersSetFromExifObject(image.exif).exposureTime
        );
    });
    console.log("THE RESPPONSSSS.... 1");
    return Promise.all(cvMatPromiseArray).then(cvMatArray => {
        let response = new cv2.Mat();
        let exposureTimesMat = cv2.matFromArray(exposureTimesArray.length, 1, cv2.CV_32FC1, exposureTimesArray);
        let calibrateObject;
        console.log("THE RESPPONSSSS.... 2");
        if (algorithm == 'debevec') {
            calibrateObject = new cv2.CalibrateDebevec();
        } else if (algorithm == 'robertson') { // this is shit, way too long
            calibrateObject = new cv2.CalibrateRobertson();
        } else {
            calibrateObject = new cv2.CalibrateDebevec();
        }
        console.log("THE RESPPONSSSS.... 3");

        // Create a MatVector and add each cv2.Mat to it
        let matVector = new cv2.MatVector();
        for (let cvMat of cvMatArray) {
            matVector.push_back(cvMat);
        }
        console.log("THE RESPPONSSSS.... 4");

        calibrateObject.process(matVector, response, exposureTimesMat);

        // Convert the response Mat to a standard JavaScript array
        let responseArray = crfCvMatToArray(response);

        // toTheDumpster([...cvMatArray, matVector, exposureTimesMat, calibrateObject, response]);
        toTheDumpster([calibrateObject]);

        // generateHdrWithCrf(matVector, exposureTimesMat, response);
        matVectorGlobal = matVector;
        exposureTimesMatGlobal = exposureTimesMat;
        responseGlobal = response;

        console.log("THE RESPPONSSSS.... 5");
        return responseArray;
    });
}

async function generateHdrWithCrf() {
    console.log('HDR  Time');

    // Await the array of Promises to get the cvMatArray
    let resultMat = new cv2.Mat();
    let mergeDebevecObject = new cv2.MergeDebevec();

    // Process HDR image with CRF
    mergeDebevecObject.process(matVectorGlobal, resultMat, exposureTimesMatGlobal, responseGlobal);
    toTheDumpster([mergeDebevecObject, exposureTimesMatGlobal, responseGlobal, matVectorGlobal]);
    return resultMat;
}


// Jette toutes les CvMat recues de facon aynchrone....
async function toTheDumpster(mats) {
    await Promise.all(mats.map(mat => new Promise(resolve => {
        setTimeout(() => {
            mat.delete();
            resolve();
        }, 0);
    })));
}

/**
 * @param {cv2.Mat} crfMat - The camera response function cv2.Mat of type CV_32FC3.
 * @returns {Array} - The resulting array in 256x1x3 format.
 */
function crfCvMatToArray(crfMat) {
    let responseArray = [];
    for (let i = 0; i < crfMat.rows; i++) {
        let row = [];
        for (let j = 0; j < crfMat.cols; j++) {
            row.push([
                crfMat.floatAt(i, j * 3), // Red channel
                crfMat.floatAt(i, j * 3 + 1), // Green channel
                crfMat.floatAt(i, j * 3 + 2) // Blue channel
            ]);
        }
        responseArray.push(row);
    }
    return responseArray;
}

/**
 * @param {Array} array - The 256x1x3 array representing the camera response function.
 * @param {cv} cv - The OpenCV object.
 * @returns {cv2.Mat} - The resulting cv2.Mat of type CV_32FC3.
 */
function crfArrayToCvMat(array, cv) {
    // Create a new Mat with the appropriate size and type
    let mat = new cv2.Mat(256, 1, cv2.CV_32FC3);

    // Iterate over the array and set the values in the Mat
    for (let i = 0; i < 256; i++) {
        mat.floatPtr(i, 0)[0] = array[i][0][0]; // Red channel
        mat.floatPtr(i, 0)[1] = array[i][0][1]; // Green channel
        mat.floatPtr(i, 0)[2] = array[i][0][2]; // Blue channel
    }
    return mat;
}

async function fileToMat(file) {
    return new Promise(async (resolve, reject) => {
        // try {
            let imageBitmap = await createImageBitmap(file);

            let canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
            const ctx = canvas.getContext("2d");

            // Draw the imageBitmap onto the canvas
            ctx.drawImage(imageBitmap, 0, 0);
            
            // Get image data from the canvas (RGBA format)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixelData = imageData.data; // RGBA data as Uint8ClampedArray

            // Convert the pixel data into a format suitable for OpenCV (Mat)
            const mat = cv2.matFromArray(canvas.height, canvas.width, cv2.CV_8UC4, pixelData);
            console.log('Ok !!');

            // Check if the matrix has an alpha channel, convert if needed
            if (mat.type() === cv2.CV_8UC4 || mat.type() === cv2.CV_32FC4) {
                let returnedMat = convertRgbaToRgb(mat); // Assume convertRgbaToRgb is defined elsewhere
                mat.delete(); // Clean up the original mat
                resolve(returnedMat);
            } else {
                resolve(mat);
            }
    });
}

function convertRgbaToRgb(rgbaMat) {
    // Create a new Mat with 3 channels (RGB) and the same size as the input RGBA Mat
    const rgbMat = new cv2.Mat(rgbaMat.rows, rgbaMat.cols, cv2.CV_8UC3);

    // Convert RGBA to RGB by copying only the first three channels
    cv2.cvtColor(rgbaMat, rgbMat, cv2.COLOR_RGBA2RGB);

    return rgbMat;
}

/**
 * @param {cv2.Mat} // of uint8 
 * @returns {cv2.Mat} // of 32f
 */
// Function to convert uint8 Mat to 32f Mat
function cvMatUInt8To32F(mat) {
    let dst = new cv2.Mat();
    // mat.convertTo(dst, cv2.CV_32FC3, 1.0 / 255.0, 0);
    mat.convertTo(dst, cv2.CV_32FC3);
    console.log(dst);
    return dst;
}

/**
 * @param {cv2.Mat} mat - The input matrix of type CV_8UC4 or CV_32FC4.
 * @returns {cv2.Mat} The converted matrix of type CV_8UC3 or CV_32FC3.
 * @throws {Error} If the input matrix is not of type CV_8UC4 or CV_32FC4.
 */
function convertRgbaToRgb(mat) {
    // Ensure the input matrix has 4 channels
    if (mat.type() !== cv2.CV_8UC4 && mat.type() !== cv2.CV_32FC4) {
        throw new Error("Input matrix must be of type CV_8UC4 or CV_32FC4");
    }
    // Convert RGBA to RGB
    let reducedMat = new cv2.Mat();
    cv2.cvtColor(mat, reducedMat, cv2.COLOR_RGBA2RGB);
    return reducedMat;
}

/**
 * Converts a 32FC3 cv2.Mat to a 3D32FMatrix
 * @param {cv2.Mat} mat - The cv2.Mat of type CV_32FC3.
 * @returns {Matrix3D32F} - The resulting 3D32FMatrix instance.
 */
function cvMatToMatrix3D32F(mat) {
    if (mat.type() !== cv2.CV_32FC3) {
        throw new Error('The cv2.Mat must be of type CV_32FC3 or CV_32F');
    }
    const rows = mat.rows;
    const cols = mat.cols;
    const matrix = new Matrix3D32F(rows, cols);
    const data = mat.data32F; // Access the Float32Array directly

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const index0 = (r * cols + c) * 3;
            const index1 = rows * cols + r * cols + c;
            const index2 = 2 * rows * cols + r * cols + c;
            matrix.data[index1] = data[index0 + 1];
            matrix.data[index2] = data[index0 + 2];
        }
    }
    return matrix;
}

/**
 * Converts a 3D32FMatrix to a 32FC3 cv2.Mat
 * @param {Matrix3D32F} matrix - The 3D32FMatrix instance.
 * @returns {cv2.Mat} - The resulting cv2.Mat of type CV_32FC3.
 */
function matrix3D32FToCvMat(matrix) {
    const {
        rows,
        cols
    } = matrix.size();
    const mat = new cv2.Mat(rows, cols, cv2.CV_32FC3);
    const data = matrix.data; // Access the Float32Array directly

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const index0 = r * cols + c;
            const index1 = rows * cols + index0;
            const index2 = 2 * rows * cols + index0;
            mat.data32F[index0 * 3] = data[index0];
            mat.data32F[index0 * 3 + 1] = data[index1];
            mat.data32F[index0 * 3 + 2] = data[index2];
        }
    }
    return mat;
}

function getMatTypeString(type) {
    switch (type) {
        case cv2.CV_8UC1:
            return 'CV_8UC1';
        case cv2.CV_8UC2:
            return 'CV_8UC2';
        case cv2.CV_8UC3:
            return 'CV_8UC3';
        case cv2.CV_8UC4:
            return 'CV_8UC4';
        case cv2.CV_8SC1:
            return 'CV_8SC1';
        case cv2.CV_8SC2:
            return 'CV_8SC2';
        case cv2.CV_8SC3:
            return 'CV_8SC3';
        case cv2.CV_8SC4:
            return 'CV_8SC4';
        case cv2.CV_16UC1:
            return 'CV_16UC1';
        case cv2.CV_16UC2:
            return 'CV_16UC2';
        case cv2.CV_16UC3:
            return 'CV_16UC3';
        case cv2.CV_16UC4:
            return 'CV_16UC4';
        case cv2.CV_16SC1:
            return 'CV_16SC1';
        case cv2.CV_16SC2:
            return 'CV_16SC2';
        case cv2.CV_16SC3:
            return 'CV_16SC3';
        case cv2.CV_16SC4:
            return 'CV_16SC4';
        case cv2.CV_32SC1:
            return 'CV_32SC1';
        case cv2.CV_32SC2:
            return 'CV_32SC2';
        case cv2.CV_32SC3:
            return 'CV_32SC3';
        case cv2.CV_32SC4:
            return 'CV_32SC4';
        case cv2.CV_32FC1:
            return 'CV_32FC1';
        case cv2.CV_32FC2:
            return 'CV_32FC2';
        case cv2.CV_32FC3:
            return 'CV_32FC3';
        case cv2.CV_32FC4:
            return 'CV_32FC4';
        case cv2.CV_64FC1:
            return 'CV_64FC1';
        case cv2.CV_64FC2:
            return 'CV_64FC2';
        case cv2.CV_64FC3:
            return 'CV_64FC3';
        case cv2.CV_64FC4:
            return 'CV_64FC4';
        default:
            return 'Unknown type';
    }
}

/**
 *  Here we will check from time to time if we can access the OpenCV
 *  functions. We will return in a callback if it has been resolved
 *  well (true) or if there has been a timeout (false).
 */
async function waitForOpencv(callbackFn, waitTimeMs = 30000, stepTimeMs = 100) {
    // console.log(await cv);
    cv2 = await cv;
    console.log(cv2);
    if (cv2.Mat) callbackFn(true)

    let timeSpentMs = 0
    const interval = setInterval(() => {
        const limitReached = timeSpentMs > waitTimeMs
        if (cv2.Mat || limitReached) {
            clearInterval(interval)
            return callbackFn(!limitReached)
        } else {
            timeSpentMs += stepTimeMs
        }
    }, stepTimeMs)
}
