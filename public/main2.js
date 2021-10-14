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
    var totalBacteria = 15;
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

    // Checks if two bacteria are colliding with each other
    function collidingBacteria(circle_1, circle_2) {
        var distance_sqaure = (circle_1.x - circle_2.x) * (circle_1.x - circle_2.x) + (circle_1.y - circle_2.y) * (circle_1.y - circle_2.y);

        var radius_square = (circle_1.r + circle_2.r) * (circle_1.r + circle_2.r);
        if (distance_sqaure == radius_square)
            return true;
        else if (distance_sqaure > radius_square)
            return true;
        else
            return false;
    }

    // Normalizes the vectors 
    function normalizeVector(circle_1, circle_2) {
        var distance_x = circle_2.x - circle_1.x;
        var distance_y = circle_2.y - circle_1.y;
        var distance = Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));

        return [(circle_2.x - circle_1.x) / distance, (circle_2.y - circle_1.y) / distance];
    }

    // Checks if a bacteria is clicked on
    canvas.onmousedown = function click(e, canvas) {
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

    // Pythagorean theorem
    function distance(bacteria_1, bacteria_2) {
        var distance_x = bacteria_2.x - bacteria_1.x;
        var distance_y = bacteria_2.y - bacteria_1.y;
        return Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));
    }


    function increaseBacteriaSize(bacteria) {
        if (!bacteria.dead) {
            // If the radius of bacteria is greater than 0.35, decrease player's life and kill the bacteria
            if (bacteria.r > 0.35) {
                destroy(bacteriaArray.indexOf(bacteria));
                playerLives--;
            } else {
                // Increase the size of each bacteria by 0.0003 each tick
                bacteria.r += 0.0004;

                // Checking if the bacteria to updates collides with any of the bacteria in the array
                for (var i = 0; i <= bacteriaArrary.length; i++) {
                    // Skip itslef 
                    if (bacteria == bacteriaArray[i]) { continue; }
                    // If the bacteria aren't in each other consumption arrays 
                    if (bacteria.consuming.indexOf(bacteriaArray[i]) == -1 && bacteriaArray[i].consuming.indexOf(bacteria) == -1) {
                        // If bacteria are touching, add it to the consuming array of this bacteria
                        if (colliding(bacteria, bacteriaArray[i])) {
                            if (bacteria.id < bacteriaArray[i].id) {
                                bacteria.consuming.push(bacteriaArray[i]);
                            }
                        }
                        // If bacteria already exists in the consuming array, move it towards it and shrink its radius
                    } else {
                        for (i in bacteria.consuming) {
                            let consuming = bacteria.consuming[i];
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
            drawCircle(bacteria.x, bacteria.y, bacteria.r, bacteria.color);
        }
    }

    function destory(bacteria, index, bacteriaArray) {
        bacteria.dead = true;
        remainingBacteria -= 1;
        bacteria.x = 0;
        bacteria.y = 0;
        bacteria.r = 0;

        for (i in bacteria.consuming) {
            destroy(bacteria.indexOf(bacteria.consuming[i], consuming[i]));
        }

        for (i in bacteriaArray) {
            if (bacteriaArray[i].consuming.indexOf(bacteria) != -1) {
                bacteriaArray[i].consuming.splice(bacteriaArray[i].consuming.indexOf(bacteria), 1);
            }
        }

        // Set the bacteria consumption array to empty and remove it from the bacteria array
        bacteria.consuming = [];
        bacteriaArray = bacteriaArray.splice(index, 1);

        // Create new bacteria
        if (remainingBacteria >= totalBacteria) {
            bacteriaArray.push(createBacteria(bacteriaId));
            createBacteria(bacteriaArray[totalBacteria - 1]);
        }

        var i = 0;
        while (i < bacteriaArray.length) {
            drawCircle(bacteriaArray[i].x, bacteriaArray[i].y, bacteriaArray[i].r, [0.24, 0.12, 0.45, 0.5]);
            i++;
        }
    }

    function calculateBacteriaCoordinates() {
        var x = Math.random() >= .5 ? 0.6 : -0.6;
        var y = Math.random() >= .5 ? 0.6 : -0.6;
        var trig = Math.random() >= .5 ? "sin" : "cos";
        var angle = Math.random();

        if (trig == "sin") {
            x = x * Math.sin(angle);
            y = y * Math.cos(angle);
        } else {
            x = x * Math.cos(angle);
            y = y * Math.sin(angle);
        }
        return [x, y];
    }

    function createBacteria(bacteriaId) {
        var id = bacteriaId;
        var consumingBacteriaArray = [];

        var bacteriaCoordinates = calculateBacteriaCoordinates();

        var bacteria = { x: bacteriaCoordinates[0], y: bacteriaCoordinates[1], r: 0.06 }

        var calculatingNewCoordinates = 250;
        // Loop to check if the new bacteria isn't colliding with any of the present bacteria
        console.log(bacteriaArray.length)
        for (var i = 0; i < bacteriaArray.length; i++) {
            // If no more room is left for bacteria to be created
            if (calculatingNewCoordinates == 0) {
                break;
            }

            if (collidingBacteria(bacteria, bacteriaArray[i])) {
                calculateBacteriaCoordinates();
                bacteria = { x: bacteriaCoordinates[0], y: bacteriaCoordinates[1], r: 0.06 }
                calculatingNewCoordinates--;
                i = -1;
            }
        }

        bacteriaSpawned++;
        return { id: id, x: bacteria.x, y: bacteria.y, r: bacteria.r, dead: false, consuming: consumingBacteriaArray }
    }

    var i = 2;
    while (i > 0) {
        var createdBacteria = createBacteria(bacteriaSpawned);
        bacteriaArray.push(createdBacteria)
        drawCircle(createdBacteria.x, createdBacteria.y, createdBacteria.r, [0.04, 0.2, 0.35, 0.5]);
        i--;
    }

    destory(bacteriaArray[1], bacteriaArray.indexOf(bacteriaArray[1]), bacteriaArray)

    // Draw the game circle
    drawCircle(0, 0, 0.6, [0.05, 0.1, 0.05, 0.5]);
}

window.onload = bacteriaBasher;