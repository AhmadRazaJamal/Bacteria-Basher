// Write the vertex shader and fragment shader functions
var vertexShaderText = [
  'precision mediump float;',

  'attribute vec3 vertPosition;',
  'attribute vec3 vertColor;',
  'uniform vec2 translation;',
  'uniform vec2 scaling;',
  'uniform vec2 rotation;',

  'varying vec3 fragColor;',

  'void main()',
  '{',
  `vec2 rotatedPosition = vec2(
    vertPosition.x * rotation.y + vertPosition.y * rotation.x,
    vertPosition.y * rotation.y - vertPosition.x * rotation.x);`,
  '	fragColor = vertColor;',
  '	gl_Position = vec4((rotatedPosition + translation) * scaling, 0.0, 1.0);',
  '}'
].join('\n');

var fragmentShaderText =
  [
    'precision mediump float;',

    'varying vec3 fragColor;',

    'void main()',
    '{',

    '	gl_FragColor = vec4(fragColor,1.0);',
    '}',
  ].join('\n')

function bacteriaBasher() {

  /* 
  Set up WebGl context 
  */

  const canvas = document.querySelector("#webgl");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Centered the circle at the center of the canvas
  gl.viewport(0, 0, canvas.width, canvas.height);

  /*  
  Create, Compile and link Shaders 
  */

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
    return;
  }
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking program!', gl.getProgramInfo(program));
    return;
  }

  /*  
  Create a circle buffer
  */

  // Converts degrees to radians
  function radian(degree) {
    var rad = degree * (Math.PI / 180);
    return rad;
  }

  // Create and bind Buffer, load buffer data and link vertex attributes with buffer 
  function attributeSetFloats(gl, prog, attr_name, rsize, arr) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr),
      gl.STATIC_DRAW);
    var attr = gl.getAttribLocation(prog, attr_name);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, rsize, gl.FLOAT, false, 0, 0);
  }

  // Draw a cicle using all the points created

  var gameDisc = [];
  var bacteriaDisc = [];

  var gameDiscColor = [];
  var bacteriaDiscColorOptions = [
    [0, 0.9, 0.5], 
    [1, 0.4, 0.3],
    [0.8, 0.4, 1]
  ];
  var bacteriaDiscColor = [];
  
  var translation = [1, 4.8];
  var rotation = [0, 1];

  function drawGameDisc(disc) {
    gl.useProgram(program);

    for (var i = 0; i <= 360; i += 1) {
      disc.push(Math.cos(radian(i)), Math.sin(radian(i)), 0);
      gameDiscColor.push(Math.tanh(radian(i)), Math.sin(radian(i)), Math.cosh(radian(i)));
    }

    // Three points constitute one triangle, so choose 3 points to draw per cycle
    attributeSetFloats(gl, program, "vertPosition", 3, disc);
    attributeSetFloats(gl, program, "vertColor", 3, gameDiscColor);

    // Sets the rotation for the main disc
    var rotationLocation = gl.getUniformLocation(program, "rotation");
    gl.uniform2fv(rotationLocation, rotation);
    
    // Scale the circle to be half the canvas width and height
    var scaling = [0.5, 0.5];
    var scalingAttributeLocation = gl.getUniformLocation(program, 'scaling');
    gl.uniform2fv(scalingAttributeLocation, scaling);

    // The length needs to be divided by 3 because we need to draw 120 triangles for 360 points
    gl.drawArrays(gl.TRIANGLE_FAN, 0, disc.length / 3);
  }

  function drawBacteriaDiscs(gameDisc, bacteriaDisc) {
    gl.useProgram(program);

    // Choose random color out of red, green or blue
    var bacteriaRandomColor = Math.floor((Math.random() * 2) + 0)

    for (var i = 0; i <= 180; i += 1) {
      bacteriaDisc.push(Math.cos(radian(i)), Math.sin(radian(i)), 0);
      bacteriaDiscColor.push(
        Math.sin(radian(i)),
        bacteriaDiscColorOptions[bacteriaRandomColor][0],
        bacteriaDiscColorOptions[bacteriaRandomColor][2]
      );
    }

    // Three points constitute one triangle, so choose 3 points to draw per cycle
    attributeSetFloats(gl, program, "vertPosition", 3, bacteriaDisc);
    attributeSetFloats(gl, program, "vertColor", 3, bacteriaDiscColor);
   
    // Scale the semi circle to be much smaller length than that of the larger game disc
    var scaling = [0.1, 0.1];
    var scalingAttributeLocation = gl.getUniformLocation(program, 'scaling');
    gl.uniform2fv(scalingAttributeLocation, scaling);

    // Translate the semi circle such that its on the circumference
    var translationLocation = gl.getUniformLocation(program, "translation");
    gl.uniform2fv(translationLocation, translation);

    // Sets the rotation for bacteria discs
    var rotation = [0.2, 1];
    var rotationLocation = gl.getUniformLocation(program, "rotation");
    gl.uniform2fv(rotationLocation, rotation);

    // The length needs to be divided by 3 because we need to draw 120 triangles for 360 points
    gl.drawArrays(gl.TRIANGLE_FAN, 0, bacteriaDisc.length / 3);
  }

  drawGameDisc(gameDisc);
  drawBacteriaDiscs(gameDisc, bacteriaDisc)
}

window.onload = bacteriaBasher;