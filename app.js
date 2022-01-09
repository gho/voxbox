import generateTerrain from "./terrain.js";

const canvas = document.querySelector("#canvas");

canvas.width = 800;
canvas.height = 600;

const gl = canvas.getContext("webgl2");
if (!gl) {
  console.error("WebGL v2 is not supported.");
  return;
}

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

function loadShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source.trimStart());
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader).slice(0, -1);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

const vertexShader = loadShader(
  gl.VERTEX_SHADER,
  `
    #version 300 es

    uniform mat4 u_projection;
    uniform mat4 u_view;

    in vec2 in_texture_coords;
    in vec4 in_position;
    in vec4 in_offset;
    in vec3 in_normal;

    out vec2 v_texture_coords;
    out vec3 v_normal;

    void main() {
      v_texture_coords = in_texture_coords;
      v_normal = in_normal;
      gl_Position = u_projection * u_view * (in_position + in_offset);
    }
  `,
);

const fragmentShader = loadShader(
  gl.FRAGMENT_SHADER,
  `
    #version 300 es

    precision highp float;

    uniform sampler2D u_texture;

    in vec2 v_texture_coords;
    in vec3 v_normal;

    out vec4 out_color;

    void main() {
      float ambient_light = 0.6;
      vec3 light_direction = normalize(vec3(-3, 1, 0));
      float diffuse_light = max(0.0, dot(v_normal, light_direction));
      float light = ambient_light + diffuse_light;
      out_color = texture(u_texture, v_texture_coords);
      out_color.rgb *= min(1.0, light);
    }
  `,
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

try {
  gl.linkProgram(program);
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message);
  }
} finally {
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
}

const vertexArray = gl.createVertexArray();
gl.bindVertexArray(vertexArray);

function createBuffer(target, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
}

function bindVertexAttribute(index, size, type, normalized, stride, offset) {
  if (typeof index === "string") {
    index = gl.getAttribLocation(program, index);
  }
  gl.enableVertexAttribArray(index);
  gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
}

//   8---7
//  /|  /|  +y
// 4---3 |   |
// | 5-|-6   +- +x
// |/  |/   /
// 1---2   +z
createBuffer(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // front
    -0.5, -0.5,  0.5, // 1
     0.5,  0.5,  0.5, // 3
    -0.5,  0.5,  0.5, // 4
    -0.5, -0.5,  0.5, // 1
     0.5, -0.5,  0.5, // 2
     0.5,  0.5,  0.5, // 3
    // back
     0.5, -0.5, -0.5, // 6
    -0.5,  0.5, -0.5, // 8
     0.5,  0.5, -0.5, // 7
     0.5, -0.5, -0.5, // 6
    -0.5, -0.5, -0.5, // 5
    -0.5,  0.5, -0.5, // 8
    // top
    -0.5,  0.5,  0.5, // 4
     0.5,  0.5, -0.5, // 7
    -0.5,  0.5, -0.5, // 8
    -0.5,  0.5,  0.5, // 4
     0.5,  0.5,  0.5, // 3
     0.5,  0.5, -0.5, // 7
    // bottom
    -0.5, -0.5, -0.5, // 5
     0.5, -0.5,  0.5, // 2
    -0.5, -0.5,  0.5, // 1
    -0.5, -0.5, -0.5, // 5
     0.5, -0.5, -0.5, // 6
     0.5, -0.5,  0.5, // 2
    // left
    -0.5, -0.5, -0.5, // 5
    -0.5,  0.5,  0.5, // 4
    -0.5,  0.5, -0.5, // 8
    -0.5, -0.5, -0.5, // 5
    -0.5, -0.5,  0.5, // 1
    -0.5,  0.5,  0.5, // 4
    // right
     0.5, -0.5,  0.5, // 2
     0.5,  0.5, -0.5, // 7
     0.5,  0.5,  0.5, // 3
     0.5, -0.5,  0.5, // 2
     0.5, -0.5, -0.5, // 6
     0.5,  0.5, -0.5, // 7
  ]),
);
bindVertexAttribute("in_position", 3, gl.FLOAT, false, 0, 0);

createBuffer(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // front
     0,  0,  1,  0,  0,  1,  0,  0,  1,
     0,  0,  1,  0,  0,  1,  0,  0,  1,
    // back
     0,  0, -1,  0,  0, -1,  0,  0, -1,
     0,  0, -1,  0,  0, -1,  0,  0, -1,
    // top
     0,  1,  0,  0,  1,  0,  0,  1,  0,
     0,  1,  0,  0,  1,  0,  0,  1,  0,
    // bottom
     0, -1,  0,  0, -1,  0,  0, -1,  0,
     0, -1,  0,  0, -1,  0,  0, -1,  0,
    // left
    -1,  0,  0, -1,  0,  0, -1,  0,  0,
    -1,  0,  0, -1,  0,  0, -1,  0,  0,
    // right
     1,  0,  0,  1,  0,  0,  1,  0,  0,
     1,  0,  0,  1,  0,  0,  1,  0,  0,
  ]),
);
bindVertexAttribute("in_normal", 3, gl.FLOAT, false, 0, 0);

createBuffer(
  gl.ARRAY_BUFFER,
  new Float32Array([
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // front
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // back
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // top
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // bottom
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // left
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, // right
  ]),
);
bindVertexAttribute("in_texture_coords", 2, gl.FLOAT, false, 0, 0);

const width = 6;
const height = 6;
const depth = 6;

const terrain = generateTerrain(width, depth);

const blocks = [];
for (let z = 0; z < depth; z++) {
  for (let x = 0; x < width; x++) {
    const h = terrain[z*width + x] * height;
    for (let y = 0; y < h; y++) {
      blocks.push(x, y, z);
    }
  }
}

createBuffer(gl.ARRAY_BUFFER, new Float32Array(blocks));
const offset = gl.getAttribLocation(program, "in_offset");
bindVertexAttribute(offset, 3, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(offset, 1);

function radians(degrees) {
  return degrees * 0.01745329251;
}

function perspective(fovy, near, far) {
  const f = Math.tan(1.57079632679 - radians(fovy)/2);
  const aspect = gl.canvas.width/gl.canvas.height;
  return [
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near+far) / (near-far), -1,
    0, 0, 2*near*far / (near-far), 0,
  ];
}

function add(x, y) {
  return [x[0]+y[0], x[1]+y[1], x[2]+y[2]];
}

function sub(x, y) {
  return [x[0]-y[0], x[1]-y[1], x[2]-y[2]];
}

function mul(x, c) {
  return [x[0]*c, x[1]*c, x[2]*c];
}

function negate(x) {
  return [-x[0], -x[1], -x[2]];
}

function norm(x) {
  const len = Math.sqrt(x[0]**2 + x[1]**2 + x[2]**2);
  return [x[0]/len, x[1]/len, x[2]/len];
}

function cross(x, y) {
  return [
    x[1]*y[2] - x[2]*y[1],
    x[2]*y[0] - x[0]*y[2],
    x[0]*y[1] - x[1]*y[0],
  ];
}

function dot(x, y) {
  return x[0]*y[0] + x[1]*y[1] + x[2]*y[2];
}

let position = [-3, 1, 1];
const up = [0, 1, 0];
let front = [1, 0, 0];

function camera() {
  const target = add(position, front);
  const f = norm(sub(target, position));
  const s = norm(cross(f, up));
  const u = cross(s, f);
  return [
    s[0], s[1], s[2], -dot(s, position),
    u[0], u[1], u[2], -dot(u, position),
    -f[0], -f[1], -f[2], dot(f, position),
    0, 0, 0, 1,
  ];
}

let forward, backward, left, right;

document.addEventListener("keydown", event => {
  switch (event.key) {
    case "w": forward = true; break;
    case "s": backward = true; break;
    case "a": left = true; break;
    case "d": right = true; break;
  }
});

document.addEventListener("keyup", event => {
  switch (event.key) {
    case "w": forward = false; break;
    case "s": backward = false; break;
    case "a": left = false; break;
    case "d": right = false; break;
  }
});

let yaw = 0, pitch = 0;

const minPitch = -89;
const maxPitch =  89;
const angularVelocity = 0.15;

canvas.onclick = () => {
  canvas.requestPointerLock();
};

function handleMouseMove(event) {
  yaw += event.movementX * angularVelocity;
  if (Math.abs(yaw) > 360) yaw = 0;

  pitch -= event.movementY * angularVelocity;
  if (pitch > maxPitch) pitch = maxPitch;
  if (pitch < minPitch) pitch = minPitch;
}

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    document.addEventListener("mousemove", handleMouseMove);
  } else {
    document.removeEventListener("mousemove", handleMouseMove);
  }
});

function update() {
  const cosPitch = Math.cos(radians(pitch));
  front = norm([
    Math.cos(radians(yaw)) * cosPitch,
    Math.sin(radians(pitch)),
    Math.sin(radians(yaw)) * cosPitch,
  ]);

  let velocity;
  if (forward)  velocity = front;
  if (backward) velocity = negate(front);
  if (left)     velocity = negate(norm(cross(front, up)));
  if (right)    velocity = norm(cross(front, up));
  if (velocity) position = add(position, mul(velocity, 0.1));
}

const image = new Image();
image.src = new URL("dirt.png", import.meta.url);

image.onload = () => {
  gl.useProgram(program);

  const projection = gl.getUniformLocation(program, "u_projection");
  gl.uniformMatrix4fv(projection, false, perspective(60, 0.1, 100));

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const view = gl.getUniformLocation(program, "u_view");

  function render() {
    update();

    gl.uniformMatrix4fv(view, true, camera());

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, blocks.length/3);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
};
