// Write the vertex shader and fragment shader functions
var vertexShaderText = [
    'attribute vec3 vertPosition;',
    '',
    'void main() {',
    '	gl_Position = vec4(vertPosition, 1.0);',
    '}'
].join('\n');

var fragmentShaderText = [
    'precision mediump float;',
    'uniform vec4 color;',
    '',
    'void main()',
    '{',
    ' gl_FragColor = color;',
    '}'
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

    canvas.width = window.innerWidth / 1.5;
    canvas.height = window.innerHeight / 1.5;

    // Centered the circle at the center of the canvas
    gl.viewport(0, 0, canvas.width / 1.7, canvas.height);

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

    gl.useProgram(program)

    // Create and bind buffer 
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Get the attribute and uniform location
    var coord = gl.getAttribLocation(program, "vertPosition");
    var fColor = gl.getUniformLocation(program, "color");

    // Point an attribute to the currently bound VBO and enable the attribute
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    /*  
     Drawing
    */

    // Game global variables
    var gameScore = 0;
    var bacteriaArray = [];
    var remainingBacteria = 25;
    var bacteriaSpawned = 0;
    var playerLives = 0;
    var totalBacteria = 8;
    var bacteriaId = 0;

    // Function to draw a circle
    function drawCircle(x, y, radius, color) {
        var vertices = [];

        // Create vertices from 1 to 360
        for (let i = 1; i <= 360; i++) {
            var y1 = radius * Math.sin(i) + y;
            var x1 = radius * Math.cos(i) + x;

            var y2 = radius * Math.sin(i + 1) + y;
            var x2 = radius * Math.cos(i + 1) + x;

            vertices.push(x, y, 0)
            vertices.push(x1, y1, 0);
            vertices.push(x2, y2, 0);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.uniform4f(fColor, color[0], color[1], color[2], color[3]);

        gl.drawArrays(gl.TRIANGLES, 0, 360 * 3);

    }

    function distance(bacteria_1, bacteria_2) {
        var distance_x = bacteria_2.x - bacteria_1.x;
        var distance_y = bacteria_2.y - bacteria_1.y;
        return Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));
    }

    // Checks if two bacteria are colliding with each other
    function collidingBacteria(bacteria1, bacteria2) {
        if (distance(bacteria1, bacteria2) - (bacteria1.r + bacteria2.r) < 0) {
            return true;
        }
        return false;
    }

    // Checks if a bacteria is clicked on
    canvas.onmousedown = function click(e) {
        var mx = e.clientX,
            my = e.clientY;

        mx = mx / canvas.width - 0.5;
        my = my / canvas.height - 0.5;

        mx = mx * 2;
        my = my * -2;

        console.log(mx + ' ' + my);
        var x = mx;
        var y = my;

        var clickedPoint = { x: x, y: y, r: 0 };

        // Loop through all bacteria and check if you clicked within the radius of any
        // Increase score and destroy the bacteria
        for (var i in bacteriaArray) {
            if (collidingBacteria(clickedPoint, bacteriaArray[i])) {
                createExplosionAtBacteria(bacArr[i]);

                score += 1;
                destroy(i);
                hit = true;
                break;
            }
        }
    }

    function destroy(bacteria, index) {
        bacteria.dead = true;
        remainingBacteria -= 1;
        bacteria.x = 0;
        bacteria.y = 0;
        bacteria.r = 0;

        for (i in bacteria.consuming) {
            destroy(bacteria.consuming[i], bacteriaArray.indexOf(bacteria.consuming[i]));
        }

        for (i in bacteriaArray) {
            if (bacteriaArray[i].consuming.indexOf(bacteria) != -1) {
                bacteriaArray[i].consuming.splice(bacteriaArray[i].consuming.indexOf(bacteria), 1);
            }
        }

        // Set the bacteria consumption array to empty and remove it from the bacteria array
        bacteria.consuming = [];
        bacteriaArray.splice(index, 1);

        // Create new bacteria if we have room for more
        if (remainingBacteria >= totalBacteria) {
            bacteriaArray.push(createBacteria(bacteriaId));
            createBacteria(bacteriaArray[totalBacteria - 1]);
        }
    }

    function increaseBacteriaSize(bacteria) {
        if (!bacteria.dead) {
            // If the radius of bacteria is greater than 0.35, decrease player's life and kill the bacteria
            if (bacteria.r > 0.35) {
                destroy(bacteria, bacteriaArray.indexOf(bacteria));
                playerLives--;
            } else {
                // Increase the size of each bacteria by 0.0003 each tick
                bacteria.r += 0.0004;

                // Checking if the bacteria to updates collides with any of the bacteria in the array
                for (var i = 0; i < bacteriaArray.length; i++) {
                    // Skip itslef 
                    if (bacteria == bacteriaArray[i]) {
                        continue;
                    }
                    // If the bacteria aren't in each other consumption arrays 
                    if (bacteria.consuming.indexOf(bacteriaArray[i]) == -1 && bacteriaArray[i].consuming.indexOf(bacteria) == -1) {
                        // If bacteria are touching, add it to the consuming array of this bacteria
                        if (collidingBacteria(bacteria, bacteriaArray[i])) {
                            if (bacteria.id < bacteriaArray[i].id) {
                                bacteria.consuming.push(bacteriaArray[i]);
                            }
                        }
                        // If bacteria already exists in the consuming array, move it towards it and shrink its radius
                    } else {
                        for (i in bacteria.consuming) {
                            var consuming = bacteria.consuming[i];
                            // If the consuming bacteria has fully entered the larger bacteria, destroy the consumed
                            if (distance(bacteria, consuming) <= (bacteria.r - consuming.r) || consuming.r <= 0.0) {
                                destroy(consuming, bacteriaArray.indexOf(consuming));
                            } else {
                                // Move the bacteria towards the consumer and decrease it's radius
                                consuming.x -= 0.001;
                                consuming.y -= 0.001;
                                consuming.r -= 0.0020;
                                bacteria.r += 0.01 * consuming.r;
                            }
                        }
                    }
                }
            }
            drawCircle(bacteria.x, bacteria.y, bacteria.r, [0.14, 0.34, 0.35, 0.5]);
        }
    }

    function calculateBacteriaCoordinates() {
        var x = Math.random() >= .5 ? 0.7 : -0.7;
        var y = Math.random() >= .5 ? 0.7 : -0.7;
        var trig = Math.random() >= .5 ? "sin" : "cos";
        var angle = Math.random();
        console.log(x, y, angle, trig)
        var x_coord, y_coord;

        if (trig == "sin") {
            x = x * Math.sin(angle);
            y = y * Math.cos(angle);
        } else {
            x = x * Math.cos(angle);
            y = y * Math.sin(angle);
        }
        return [x, y];
    }

    function createBacteria() {
        var id = bacteriaId;
        var consumingBacteriaArray = [];

        var bacteriaCoordinates = calculateBacteriaCoordinates();

        var bacteria = { x: bacteriaCoordinates[0], y: bacteriaCoordinates[1], r: 0.07 }

        var calculatingNewCoordinates = 500;
        // Loop to check if the new bacteria isn't colliding with any of the present bacteria
        for (var i = 0; i < bacteriaArray.length; i++) {
            // If no more room is left for bacteria to be created
            if (calculatingNewCoordinates == 0) {
                console.log("no room")
                break;
            }

            if (collidingBacteria(bacteria, bacteriaArray[i])) {
                var newBacteriaCoordinates = calculateBacteriaCoordinates();
                bacteria = { x: newBacteriaCoordinates[0], y: newBacteriaCoordinates[1], r: 0.07 }
                calculatingNewCoordinates--;
                i = -1;
            }
        }

        bacteriaId += 1;
        return {...bacteria, id: id, dead: false, consuming: consumingBacteriaArray }
    }

    for (var i = 0; i < totalBacteria; i++) {
        var createdBacteria = createBacteria();
        bacteriaArray.push(createdBacteria);
        drawCircle(createdBacteria.x, createdBacteria.y, createdBacteria.r, [0.14, 0.34, 0.35, 0.5]);
    }

    // Draw the game circle
    console.log(bacteriaArray)

    // Game Loop
    function gameLoop() {
        // Updates the score span element in the html
        for (i in bacteriaArray) {
            increaseBacteriaSize(bacteriaArray[i]);
        }
        drawCircle(0, 0, 0.7, [0.05, 0.1, 0.05, 0.5]);
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

window.onload = bacteriaBasher;