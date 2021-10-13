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
                bacArray[i].destroy(i);
                hit = true;
                break;
            }
        }
    }

    function spawnBacteria() {

        // get new random data for determining x and y
        getNewRandomTrigData();

        // get new x and y values along the game circle
        getCircPoints();

        // Variable to ensure no infinite loop is created
        var attempt = 0;

        // Loop through all Bacteria to ensure no collision on spawn
        for (var i = 0; i < bacteriaArray.length; i++) {
            // Error check to not break the game if the bacteria cover the whole game surface.
            if (attempt > 500) {
                console.log("No area for new bacteria to spawn");
                break;
            }

            // If theres a collision with a specific object, the variables need to be randomized again
            // Also need to set i = -1 to ensure it loops through all bacteria again
            if (colliding(this.x, this.y, 0.06, bacArr[i].x, bacArr[i].y, bacArr[i].r)) {
                getNewRandomTrigData();
                getCircPoints();
                attempt++;
                i = -1;
            }
        }

        // Store new data for each Bacteria
        r = 0.06;
        // times by 0.65 to ensure the bacteria isn't as light as the canvas
        color = [Math.random() * (0.65), Math.random() * (0.65), Math.random() * (0.65), 0.75];
        alive = true;
        consuming = [];
        bacteriaSpawned++;
    }


    function updateBacteriaStatus() {

        if (alive) {
            // If a certain threshold (r=0.3) destroy the bacteria and decrease player's lives
            if (r > 0.3) {
                lives--;
                this.destroy(bacArr.indexOf(this));
            } else {
                // Increase the size of each bacteria by 0.0003 each tick
                this.r += 0.0003;
                //increase alpha as bacteria grows
                this.color[3] += 0.0003;

                /* Collision Check with consuming assigning,
                     finds which bacteria are colliding and sets the larger one to consume the other */
                for (i in bacArr) {
                    //Skip itself
                    if (this != bacArr[i]) {
                        //If either 'this' or bacArr[i] are not in each other's 'consuming' array - continue.
                        if (this.consuming.indexOf(bacArr[i]) == -1 && bacArr[i].consuming.indexOf(this) == -1) {
                            //If 'this' and bacArr[i] are colliding add it to this bacteria with the larger radius' 'consuming' array
                            if (colliding(this.x, this.y, this.r, bacArr[i].x, bacArr[i].y, bacArr[i].r)) {
                                if (this.id < bacArr[i].id) {
                                    this.consuming.push(bacArr[i]);
                                }
                            }
                            // Else if bacArr[i] is in this.consuming, have 'this' consume bacArr[i] by moving it inside of 'this' and shrinking it's radius
                        } else {
                            for (i in this.consuming) {
                                // Easier than typing this.consuming[i].* everytime
                                let consuming = this.consuming[i];
                                // If the consuming bacteria has fully entered the larger bacteria, destroy the consumed
                                if (distance(this.x, this.y, consuming.x, consuming.y) <= (this.r - consuming.r) || consuming.r <= 0.0) {
                                    consuming.destroy(bacArr.indexOf(consuming));
                                } else {
                                    // Normalize vector in order to ensure consistent consumption. Specifically to the speed of consumption
                                    var dVec = normalize(this.x, this.y, consuming.x, consuming.y);
                                    /* While being consumed, the bacteria will
                                    move in the direction of the consumer,
                                    its radius will be shrunk and the consumer's
                                    will grow */
                                    consuming.x -= dVec[0] / (1800 * consuming.r);
                                    consuming.y -= dVec[1] / (1800 * consuming.r);
                                    consuming.r -= 0.0025;
                                    this.r += 0.01 * consuming.r;
                                    //Increase alpha of the bacteria causing it to become darker as it consumes.
                                    this.color[3] += 0.001;
                                }
                            }
                        }
                    }
                }
            }
            // Draw
            draw_circle(this.x, this.y, this.r, this.color);
        }
    }

    function kaboom() {
        function createExplosion(bacteria) {
            bacteria.x = x;
            bacteria.y = y;
            bacteria.r = r; //radius
            //convert color to 255 not 1, and of opacity 1
            bacteria.color = "rgba(" + Math.round((color[0]) * 255)+ "," + Math.round((color[1]) * 255) + "," + Math.round((color[2]) * 255) + "," + 1 + ")";
            //speed??
            var life = 20 + Math.random() * 5;
        }

        var pCanvas = (document.getElementById('particles').getContext('2d'));
        function draw () {
            if(life > 0) {
                pCanvas.beginPath();
                pCanvas.arc(bacteria.x, bacteria.y, bacteria.r, 0, Math,PI*2);
                pCanvas.fillStyle = color;
                pCanvas.fill();
                life--;
                x -= 0.2;
                y -= 0.2;
                r -= 0.5;
            }
        }
    }




    drawCircle(0, 0, 0.8, [0.05, 0.1, 0.05, 0.5]);
}

window.onload = bacteriaBasher;