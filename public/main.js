// Write the vertex shader and fragment shader functions
var vertexShaderText = [
  'precision mediump float;',

  'attribute vec2 vertPosition;',
  'attribute vec3 vertColor;',

  'varying vec3 fragColor;',

  'void main()',
  '{',
  '	fragColor = vertColor;',
  '	gl_Position = vec4(vertPosition,0.0,1.0);',
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
  gl.viewport(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2);

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
  function drawCircle() {
    gl.useProgram(program);

    var rotationradian = [];
    for (var i = 0; i <= 360; i += 1) {
      rotationradian.push(Math.cos(radian(i)), Math.sin(radian(i)), 0);
    }

    // Three points constitute one triangle, so choose 3 points to draw per cycle
    attributeSetFloats(gl, program, "vertPosition", 3, rotationradian);
    // The length needs to be divided by 3 because we need to draw 120 triangles for 360 points
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rotationradian.length / 3);
  }

  drawCircle();
}

window.onload = bacteriaBasher;