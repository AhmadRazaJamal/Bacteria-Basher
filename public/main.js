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
	gl.viewport(0,0,canvas.width,canvas.height);

  /*  
  Create, Compile and link Shaders 
  */

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader,vertexShaderText);
	gl.shaderSource(fragmentShader,fragmentShaderText);

  gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

  var program = gl.createProgram();
	gl.attachShader(program,vertexShader);
	gl.attachShader(program,fragmentShader);

	gl.linkProgram(program);
	if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
  }

  /*  
  Create a circle buffer
  */

	//all arrays in JS is Float64 by default
	var triangleVertices = [
		//X,   Y,     R, G, B
		Math.cos(0.0),  Math.sin(0.5),    1, 0, 0,
		Math.cos(-0.5),  Math.sin(-0.5), ,    0, 1, 0,
		Math.cos(0.5),  Math.sin(-0.5),     0, 0, 1
	];

	var triangleVertexBufferObject = gl.createBuffer();
	//set the active buffer to the triangle buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	//gl expecting Float32 Array not Float64
	//gl.STATIC_DRAW means we send the data only once (the triangle vertex position
	//will not change over time)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices),gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
	var colorAttribLocation = gl.getAttribLocation(program,'vertColor');
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		2, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.vertexAttribPointer(
		colorAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
		2*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
		);
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.useProgram(program);
	
	 /*  
    Drawing the circle
  */
		
	gl.clearColor(0.5,0.8,0.8,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);	
	gl.drawArrays(gl.TRIANGLES,0,3);
	

}

window.onload = bacteriaBasher;