'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let plane;                      // Background plane
let video;                      // 
let track;                      //
let videoTexture;
let image;
let texture;
let cam;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexTextureBuffer = gl.createBuffer();
    this.count = 0;
    this.textureCount = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.TextureBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.textureCount = vertices.length / 2;
    }

    this.Draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}

function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iAttribVertexTexture = -1;

    this.iModelViewProjectionMatrix = -1;

    this.iTMU = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}

function draw() {
    gl.clearColor(1., 1., 1., 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI / 8, 1, 8, 15);

    let modelView = spaceball.getViewMatrix();

    cam.updateValues();

    cam.ApplyLeftFrustum();
    let projection2 = cam.mProjectionMatrix
    cam.ApplyRightFrustum();
    let projection3 = cam.mProjectionMatrix;

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0);
    let translateToPointZero = m4.translation(-2.5, -2.5, -13);
    let translateToLeft = m4.translation(-0.03, 0, -10);
    let translateToRight = m4.translation(0.03, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(rotateToPointZero, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    let matAccum2 = m4.multiply(translateToLeft, matAccum0);
    let matAccum3 = m4.multiply(translateToRight, matAccum0);

    let modelViewProjection = m4.multiply(translateToPointZero, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(projection, modelViewProjection));
    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video
    );

    gl.uniform1f(shProgram.iB, 1);
    plane.Draw();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );
    gl.uniform1f(shProgram.iB, -1);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection2);
    gl.colorMask(false, true, true, false);
    surface.Draw();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum3);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection3);
    gl.colorMask(true, false, false, false);
    surface.Draw()

    gl.colorMask(true, true, true, true);
}

function continiousDraw() {
    draw();
    window.requestAnimationFrame(continiousDraw)
}

function CreateSurfaceData() {
    let vertexList = [];
    let u1 = 0;
    let v = -Math.PI;
    const LIMIT_U = Math.PI * 2
    const LIMIT_V = Math.PI
    const INC = 0.25
    while (u1 < LIMIT_U) {
        while (v < LIMIT_V) {
            const v1 = SnialSurfaceData(u1, v);
            const v2 = SnialSurfaceData(u1 + INC, v);
            const v3 = SnialSurfaceData(u1, v + INC);
            const v4 = SnialSurfaceData(u1 + INC, v + INC);
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v4.x, v4.y, v4.z)
            vertexList.push(v3.x, v3.y, v3.z)
            v += INC
        }
        v = -Math.PI
        u1 += INC
    }
    return vertexList;
}
function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}
function CreateSurfaceTextureData() {
    let vertexTextureList = [];
    let u1 = 0;
    let v1 = -Math.PI;
    const LIMIT_U = Math.PI * 2
    const LIMIT_V = Math.PI
    const INC = 0.25
    while (u1 < LIMIT_U) {
        while (v1 < LIMIT_V) {
            let u = map(u1, 0, LIMIT_U, 0, 1)
            let v = map(v1, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1 + INC, 0, LIMIT_U, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1, 0, LIMIT_U, 0, 1)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1 + INC, 0, LIMIT_U, 0, 1)
            v = map(v1, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1, 0, LIMIT_U, 0, 1)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            v1 += INC
        }
        v1 = -Math.PI
        u1 += INC
    }
    return vertexTextureList;
}

function SnialSurfaceData(u, v) {
    let x = 0.15 * u * Math.sin(u) * Math.cos(v)
    let y = 0.15 * u * Math.cos(u) * Math.cos(v)
    let z = -0.15 * u * Math.sin(v)
    return {
        x: x,
        y: y,
        z: z
    }
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexTexture = gl.getAttribLocation(prog, "vertexTexture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iTMU = gl.getUniformLocation(prog, 'TMU');
    shProgram.iB = gl.getUniformLocation(prog, 'b');

    LoadTexture()
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.TextureBufferData(CreateSurfaceTextureData());
    plane = new Model('Plane')
    plane.BufferData([0, 0, 0, 5, 0, 0, 5, 5, 0, 5, 5, 0, 0, 5, 0, 0, 0, 0]);
    plane.TextureBufferData([1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1]);
    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function init() {
    let canvas;
    cam = new StereoCamera(
        2000,
        70.0,
        1,
        0.8,
        5,
        100
    );
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        video = document.createElement('video');
        video.setAttribute('autoplay', true);
        window.vid = video;
        getWebcam();
        videoTexture = CreateWebCamTexture();
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    continiousDraw();
}

function StereoCamera(
    Convergence,
    EyeSeparation,
    AspectRatio,
    FOV,
    NearClippingDistance,
    FarClippingDistance
) {
    this.mConvergence = Convergence;
    this.mEyeSeparation = EyeSeparation;
    this.mAspectRatio = AspectRatio;
    this.mFOV = FOV;
    this.mNearClippingDistance = NearClippingDistance;
    this.mFarClippingDistance = FarClippingDistance;

    this.mProjectionMatrix = null;
    this.mModelViewMatrix = null;

    this.ApplyLeftFrustum = function () {
        let top, bottom, left, right;
        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
        let b = a - this.mEyeSeparation / 2;
        let c = a + this.mEyeSeparation / 2;

        left = (-b * this.mNearClippingDistance) / this.mConvergence;
        right = (c * this.mNearClippingDistance) / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.frustum(
            left,
            right,
            bottom,
            top,
            this.mNearClippingDistance,
            this.mFarClippingDistance
        );

        // Displace the world to right
        this.mModelViewMatrix = m4.translation(
            this.mEyeSeparation / 2,
            0.0,
            0.0
        );
    };

    this.ApplyRightFrustum = function () {
        let top, bottom, left, right;
        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
        let b = a - this.mEyeSeparation / 2;
        let c = a + this.mEyeSeparation / 2;

        left = (-c * this.mNearClippingDistance) / this.mConvergence;
        right = (b * this.mNearClippingDistance) / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.frustum(
            left,
            right,
            bottom,
            top,
            this.mNearClippingDistance,
            this.mFarClippingDistance
        );

        // Displace the world to left
        this.mModelViewMatrix = m4.translation(
            -this.mEyeSeparation / 2,
            0.0,
            0.0
        );
    };

    this.updateValues = function () {
        let values = document.getElementsByClassName("value");
        let eyeSep = 70.0;
        eyeSep = document.getElementById("input1").value;
        values[0].innerHTML = eyeSep;
        this.mEyeSeparation = eyeSep;
        let ratio = 1.0;
        let fov = 0.8;
        fov = document.getElementById("input2").value;
        values[1].innerHTML = fov;
        this.mFOV = fov;
        let nearClip = 5.0;
        nearClip = document.getElementById("input3").value - 0.0;
        values[2].innerHTML = nearClip;
        this.mNearClippingDistance = nearClip
        let convergence = 2000.0;
        convergence = document.getElementById("input4").value;
        values[3].innerHTML = convergence;
        this.mConvergence = convergence
    }
}


function LoadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    image = new Image();
    image.crossOrigin = 'anonymus';

    image.src = "https://raw.githubusercontent.com/minishmek/Labs_Vggi/CGW/12034.jpeg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}

function getWebcam() {
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
        video.srcObject = stream;
        track = stream.getTracks()[0];
    }, function (e) {
        console.error('Rejected!', e);
    });
}

function CreateWebCamTexture() {
    let textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textureID;
}