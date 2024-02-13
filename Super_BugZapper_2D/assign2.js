var VSHADER =
    'attribute vec4 position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = position;\n' +
    '  gl_PointSize = 5.0;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

var FSHADER =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

var gl;
//bacteria parameters
var numOfBac = 7;
var segments = 100;
var maxRadius = 0.25;
var growthRate = 6;
var bacteriaList = [];
var initialTheta;

//circle parameters
var circleVertices = [];
var circleRadius = 0.75;

//scoring and endless mode
var userScore = 0;
var win = false;
var endless = false;
var startTime;
var endlessStartTime;
var endlessNumBac = 1;

function main(difficulty) {
    switch(difficulty){
        case "easy":
            numOfBac = 5;
            growthRate = 5;
            break;
        case "medium":
            numOfBac = 7;
            growthRate = 6;
            break;
        case "hard":
            numOfBac = 9;
            growthRate = 7;
            break;
        case "endless":
            endless = true;
            endlessStartTime = Date.now();
            break;
    }
    var canvas = document.getElementById('gl-canvas');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to retrieve webGL');
        return;
    }
    createBacteria(numOfBac);
    canvas.onmousedown = function(ev){ click(ev, canvas); };
    startTime = Date.now();
    animate(gl);
}

var lastUpdate = Date.now();
function animate(gl) {
    var elapsed = Date.now() - startTime;
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawCircle(gl);

    let maxedBacteriaCount = 0;
    if(endless) {
        if(bacteriaList.length < 3){
            createBacteria(endlessNumBac);
        }
        if(Date.now() - lastUpdate >= 10000){
            endlessNumBac++;
            lastUpdate = Date.now();
        }
        for(let i = 0; i < bacteriaList.length; i++){
            var bacteriaElapsedTime = Date.now() - bacteriaList[i].creationTime;
            bacteriaList[i].currentRadius = Math.min(maxRadius, bacteriaElapsedTime * growthRate/100000);
            drawBacteria(gl, bacteriaList[i]);
            if (bacteriaList[i].currentRadius === maxRadius) {
                maxedBacteriaCount++;
            }
            if (maxedBacteriaCount >= 2) {
                document.getElementById('win').textContent = 'Bacteria Wins!';
                return;
            }
        }
    } else {
        for (let i = 0; i < numOfBac; i++) {
            if (bacteriaList[i] && typeof bacteriaList[i].currentRadius !== 'undefined' && bacteriaList[i].currentRadius <= maxRadius) {
                bacteriaList[i].currentRadius = Math.min(maxRadius, elapsed * growthRate/100000);
                drawBacteria(gl, bacteriaList[i]);
            }
        }
    }

    document.getElementById('userScore').textContent = userScore.toString();
    var allBacteriaMaxed = bacteriaList.every(bacteria => bacteria.currentRadius === maxRadius);
    if (userScore < numOfBac && allBacteriaMaxed) {
        win = false;
    }
    if(userScore == numOfBac && !endless){
        win = true;
    }
    if(allBacteriaMaxed){
        document.getElementById('win').textContent = win ? 'User wins!' : 'Bacteria Wins!';
        return;
    }

    requestAnimationFrame(function () {
        animate(gl);
    });
}


function drawCircle(gl) {
    // initialize shaders
    if (!initShaders(gl, VSHADER, FSHADER)) {
        console.log('Failed to initialize shaders.');
        return;
    }


    // compute vertices
    for (let i = 0; i <= segments; i++) {
        var theta = (i / segments) * 2 * Math.PI;
        var x = circleRadius * Math.cos(theta);
        var y = circleRadius * Math.sin(theta);
        circleVertices.push(x, y, 0.0, ...[1.0, 1.0, 1.0]);
    }

    // create circle buffer
    var circleColorBuffer = gl.createBuffer();
    if (!circleColorBuffer) {
        console.log('Failed to create circle buffer');
        return false;
    }

    // write circle vertices to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, circleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);

    // Enable attribute pointer with buffer
    var position = gl.getAttribLocation(gl.program, 'position');
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(a_Color);

    console.log("Rendering Circles");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length / 6);
}

function createBacteria(newBac){
    for (let i = 0; i < newBac; i++) {
        initialTheta = (Math.random() * (100) + 0) / segments * 2 * Math.PI;
        bacteriaList.push({
            initialTheta: initialTheta,
            cx: circleRadius * Math.cos(initialTheta),
            cy: circleRadius * Math.sin(initialTheta),
            color: [Math.random(), Math.random(), Math.random()],
            currentRadius: 0.0,
            creationTime: Date.now(), // Track creation time for each bacteria
        });
    }
}

function drawBacteria(gl, bacteria) {
    // compute vertices
    var bacVertices = [];
    for (let i = 0; i <= segments; i++) {
        var theta = bacteria.initialTheta + (i / segments) * 2 * Math.PI;
        var x = bacteria.cx + bacteria.currentRadius * Math.cos(theta);
        var y = bacteria.cy + bacteria.currentRadius * Math.sin(theta);
        bacVertices.push(x, y, 0.0, ...bacteria.color);
    }

    // create bacteria buffer
    var bacColorBuffer = gl.createBuffer();
    if (!bacColorBuffer) {
        console.log('Failed to create bacteria buffer');
        return false;
    }

    // write bacteria vertices and colors to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, bacColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bacVertices), gl.STATIC_DRAW);

    // Set up attribute pointers for position and color
    var position = gl.getAttribLocation(gl.program, 'position');
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(a_Color);

    console.log("Rendering Bacteria");
    gl.drawArrays(gl.TRIANGLE_FAN, 0, bacVertices.length / 6);
}

function click(ev,canvas) { 
    if (gl.isContextLost()) {
        console.log('WebGL context is lost. Recreating...');
        gl = getWebGLContext(canvas);
        if (!gl) {
            console.log('Failed to recreate WebGL context.');
            return;
        }
        console.log('WebGL context recreated successfully.');
    }

    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    // Convert mouse coordinates to canvas coordinates
    var mouseX = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    var mouseY = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    removeBacteriaOnClick(bacteriaList, mouseX, mouseY);
}

function removeBacteriaOnClick(bacteriaList, mouseX, mouseY) {
    // Iterate through the bacteriaList in reverse order
    for (let i = bacteriaList.length - 1; i >= 0; i--) {
        var bacteria = bacteriaList[i];

        // Calculate distance between mouse click and bacteria center
        var distance = Math.sqrt(
            Math.pow(mouseX - bacteria.cx, 2) + Math.pow(mouseY - bacteria.cy, 2)
        );

        // Check if the mouse click is inside the bacteria's bounding box
        if (distance < bacteria.currentRadius) {
            // Remove the bacteria from the list
            bacteriaList.splice(i, 1);
            userScore++;
            console.log("Bacteria removed!");
            // Break out of the loop to remove only one bacteria per click
            break;
        }
    }
}
