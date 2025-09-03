window.onload = function(){

/*============== Creating a canvas ====================*/
const canvas = document.getElementById("gl-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL is not supported in this browser.");
    return;
}

/*======== Defining and storing the geometry ===========*/
let vertices = [];

generateTree(0, -.7, Math.PI / 2, 6, vertices); 

// Create an empty buffer object
const vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

/*================ Shaders ====================*/
// Vertex shader source code
var vertCode =
    'attribute vec3 coordinates;' +
    'void main(void) {' +
        ' gl_Position = vec4(coordinates, 1.0);' +
    '}';

// Create a vertex shader object    
const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

// Fragment shader source code
const fragCode = `
precision mediump float;
void main(void) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;

// Create fragment shader object
const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

// Create a shader program object to store the combined shader program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

/*======= Associating shaders to buffer objects =======*/
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
const coord = gl.getAttribLocation(shaderProgram, "coordinates");
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coord);

/*========= Drawing the triangle ===========*/
gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.drawArrays(gl.LINES, 0, vertices.length / 3);

// Recursive tree builder
function generateTree(x1, y1, angle, depth, vertices) {
    if (depth === 0) return;
   
    // Length shrinks each step
    const length = 0.4 * Math.pow(0.7, (6 - depth));

    // Endpoint of this branch
    const x2 = x1 + length * Math.cos(angle);
    const y2 = y1 + length * Math.sin(angle);

    // Push line segment into vertices (x1,y1) → (x2,y2)
    vertices.push(x1, y1, 0,  x2, y2, 0);

    const branchAngle = Math.PI / 8;
    generateTree(x2, y2, angle - branchAngle, depth - 1, vertices);
    generateTree(x2, y2, angle + branchAngle, depth - 1, vertices);
}
}