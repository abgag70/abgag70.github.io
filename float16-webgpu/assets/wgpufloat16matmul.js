import { Float16ArrayLike, castFloat16ToFloat32 } from './float16-array.js'
import { matMul } from './wgpu-matmul-pipeline.js'

function getMatrices() {
    // Get all input elements for Matrix A and Matrix B
    const matrixAInputs = document.querySelectorAll('#matrixA input');
    const matrixBInputs = document.querySelectorAll('#matrixB input');

    // Check that each matrix has exactly 16 input elements
    if (matrixAInputs.length !== 16 || matrixBInputs.length !== 16) {
        throw new Error("Both Matrix A and Matrix B must contain 16 input elements.");
    }

    // Create two Float32Array objects
    const matrixA = new Float32Array(16);
    const matrixB = new Float32Array(16);

    // Fill the arrays with values from the inputs
    matrixAInputs.forEach((input, i) => {
        matrixA[i] = parseFloat(input.value) || 0;
    });

    matrixBInputs.forEach((input, i) => {
        matrixB[i] = parseFloat(input.value) || 0;
    });

    // Return the two matrices, for example as an array or an object
    return { matrixA, matrixB };
}
// Function to handle matrix changes
async function handleMatrixChange() {
    const mats = getMatrices();
    let matrixA = new Float16ArrayLike(mats.matrixA.length);
    let matrixB = new Float16ArrayLike(mats.matrixB.length);
    for (let i = 0; i < 16; i++) {
        matrixA[i] = mats.matrixA[i];
        matrixB[i] = mats.matrixB[i];
    }
    const matrixC = await matMul(matrixA, matrixB);
    fillMatrixC(matrixC);
}

function fillWithRandomAandB() {
    // Get all inputs for Matrix A and Matrix B
    const matrixAInputs = document.querySelectorAll('#matrixA input');
    const matrixBInputs = document.querySelectorAll('#matrixB input');

    // Function to generate a random number between 0 and 1 and round to 4 decimal places
    const getRandomValue = () => (10**Math.random()).toFixed(4);

    // Fill each input in Matrix A with a random value rounded to 4 decimals
    matrixAInputs.forEach(input => {
        input.value = getRandomValue();
    });

    // Fill each input in Matrix B with a random value rounded to 4 decimals
    matrixBInputs.forEach(input => {
        input.value = getRandomValue();
    });
}

function fillMatrixC(matrixValues) {
    // Check that the argument is a Float32Array of length 16
    if (!(matrixValues instanceof Uint16Array) || matrixValues.length !== 16) {
        throw new Error("Argument must be a Float16ArrayLike of length 16");
    }

    // Get all inputs for Matrix A
    const matrixCInputs = document.querySelectorAll('#matrixC input');
    if (matrixCInputs.length !== 16) {
        throw new Error("Matrix A container must have 16 input elements");
    }

    // Fill each input with the corresponding value from the Float32Array,
    // rounded to 4 decimal places.
    matrixCInputs.forEach((input, index) => {
        input.value = castFloat16ToFloat32(matrixValues[index]);
    });
}


// Attach the 'input' event listener to every input in both matrices
document.querySelectorAll('#matrixA input, #matrixB input').forEach(input => {
    input.addEventListener('input', handleMatrixChange);
});

fillWithRandomAandB();

const mats = getMatrices();

console.log(mats.matrixA);


let matrixA = new Float16ArrayLike(mats.matrixA.length);
let matrixB = new Float16ArrayLike(mats.matrixB.length);

for (let i = 0; i < 16; i++) {
    matrixA[i] = mats.matrixA[i];
    matrixB[i] = mats.matrixB[i];
}

const matrixC = await matMul(matrixA, matrixB);
fillMatrixC(matrixC);
// for (let i = 0; i < 16; i++) {
//     console.log(castFloat16ToFloat32(result[i]));
// }
// console.log('\n');
