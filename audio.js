let context,
  panner;
function audioInit() {
  let audio = document.getElementById('au');
  let cbox = document.getElementById('input5');
  audio.addEventListener('play', () => {
    if (!context) {
      context = new AudioContext();
      let source = context.createMediaElementSource(audio);
      panner = context.createPanner();
      let fltr = context.createBiquadFilter();

      source.connect(panner);
      panner.connect(fltr);
      fltr.connect(context.destination);

      fltr.type = 'notch';
      fltr.Q.value =1000;
      // fltr.detune.value = 0.5;
      fltr.frequency.value =1000;
      context.resume();
    }
  })

  audio.addEventListener('pause', () => {
    console.log('pause');
    context.resume();
  })
  cbox.addEventListener('change', function() {
    if (cbox.checked) {
      panner.disconnect();
      panner.connect(fltr);
      fltr.connect(context.destination);
    } else {
      panner.disconnect();
      panner.connect(context.destination);
    }
  });
}

// code to place sound source
let sourceSurface;

function translateSphere(a) {
  const alphaRad = a[1];
  const betaRad = a[2];
  const gammaRad = a[0];

  let up = [0, 0, 1];

  // Rotation around the z-axis (gamma)
  const rotZ = [
    [Math.cos(gammaRad), -Math.sin(gammaRad), 0],
    [Math.sin(gammaRad), Math.cos(gammaRad), 0],
    [0, 0, 1]
  ];
  up = matXvec(rotZ, up);

  // Rotation around the y-axis (beta)
  const rotY = [
    [Math.cos(betaRad), 0, Math.sin(betaRad)],
    [0, 1, 0],
    [-Math.sin(betaRad), 0, Math.cos(betaRad)]
  ];
  up = matXvec(rotY, up);

  // Rotation around the x-axis (alpha)
  const rotX = [
    [1, 0, 0],
    [0, Math.cos(alphaRad), -Math.sin(alphaRad)],
    [0, Math.sin(alphaRad), Math.cos(alphaRad)]
  ];
  up = matXvec(rotX, up);

  return up;
}

function matXvec(mat, vec) {
  let matAcc = [];
  for (let i = 0; i < mat.length; i++) {
    let sum = 0;
    for (let j = 0; j < vec.length; j++) {
      sum += mat[i][j] * vec[j];
    }
    matAcc.push(sum);
  }
  return matAcc;
}

// code to create spheres geo

function createSphereSurface(r) {
  let vertexList = [];
  let lon = -Math.PI;
  let lat = -Math.PI * 0.5;
  const STEP = 0.1;
  while (lon < Math.PI) {
    while (lat < Math.PI * 0.5) {
      let v1 = sphere(r, lon, lat);
      let v2 = sphere(r, lon + STEP, lat);
      let v3 = sphere(r, lon, lat + STEP);
      let v4 = sphere(r, lon + STEP, lat + STEP);
      vertexList.push(v1.x, v1.y, v1.z);
      vertexList.push(v2.x, v2.y, v2.z);
      vertexList.push(v3.x, v3.y, v3.z);
      vertexList.push(v3.x, v3.y, v3.z);
      vertexList.push(v4.x, v4.y, v4.z);
      vertexList.push(v2.x, v2.y, v2.z);
      lat += STEP;
    }
    lat = -Math.PI * 0.5
    lon += STEP;
  }
  return vertexList;
}

function sphere(r, u, v) {
  let x = r * Math.sin(u) * Math.cos(v);
  let y = r * Math.sin(u) * Math.sin(v);
  let z = r * Math.cos(u);
  return { x: x, y: y, z: z };
}