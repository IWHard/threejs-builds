window.onload = function () {
  /*============== Creating a canvas ====================*/
  const canvas = document.getElementById("gl-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl");

  if (!gl) {
    console.error("WebGL is not supported in this browser.");
    return;
  }

  /*=========== Hexágono con triángulos ==============*/
  const radius = .2;
  let vertices = [0, 0, 0];
  let colors = [1, 1, 1];

  for (let i = 0; i <= 6; i++) {
    let angle = (i * Math.PI) / 3;
    vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    colors.push(0, 0, 0);
  }

  let indices = [];
  for (let i = 1; i <= 6; i++) {
    indices.push(0, i, i + 1);
  }

  // Buffers
  let vertex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  let color_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  let index_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  /*==========================Shaders=========================*/
  let vertCode = `
    attribute vec3 position;
    attribute vec3 color;
    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;
    varying vec3 vColor;
    void main(void) {
      gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
      vColor = color;
    }`;

  let fragCode = `
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor, 1.0);
    }`;

  let vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  let shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  /*===========asociando atributos===========*/
  let Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
  let Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
  let Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  let position = gl.getAttribLocation(shaderProgram, "position");
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  let color = gl.getAttribLocation(shaderProgram, "color");
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(color);

  gl.useProgram(shaderProgram);

  /*========================= MATRIX ========================= */
  function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * 0.5) * Math.PI / 180);
    return [
      0.5 / ang, 0, 0, 0,
      0, 0.5 * a / ang, 0, 0,
      0, 0, -(zMax + zMin) / (zMax - zMin), -1,
      0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
  }

  let proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);
  let mov_matrix = [1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1];
  let view_matrix = [1, 0, 0, 0,
                     0, 1, 0, 0,
                     0, 0, 1, 0,
                     0, 0, -5, 1];

  /*======================= Transformaciones ========================*/
  function rotateZ(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    let mv0 = m[0], mv4 = m[4], mv8 = m[8];
    m[0] = c * m[0] - s * m[1];
    m[4] = c * m[4] - s * m[5];
    m[8] = c * m[8] - s * m[9];
    m[1] = c * m[1] + s * mv0;
    m[5] = c * m[5] + s * mv4;
    m[9] = c * m[9] + s * mv8;
  }

  function translate(m, tx, ty, tz) {
    m[12] += tx;
    m[13] += ty;
    m[14] += tz;
  }

  /*================= Movimiento y rebote ==================*/
  let time_old = 0;
  let posX = 0, posY = 0;
  let velX = 0.02, velY = 0.015;
  let angle = 0;

  function animate(time) {
    let dt = time - time_old;
    time_old = time;

    // reset mov_matrix
    mov_matrix = [1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  posX, posY, 0, 1];

    // rotación
    angle += dt * 0.002;
    rotateZ(mov_matrix, angle);

    // rebote
    posX += velX;
    posY += velY;
    if (posX > 2 || posX < -2) velX *= -1;
    if (posY > 1.5 || posY < -1.5) velY *= -1;

    // dibujo
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(animate);
  }
  animate(0);
};
