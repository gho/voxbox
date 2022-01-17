import World from "./world.js";
import Input from "./input.js";
import Player from "./player.js";
import {perspective} from "./math.js";

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
      vec3 light_direction = normalize(vec3(0, -3, 1));
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
  // position, texture, normal
  new Float32Array([
    // front
    -0.5, -0.5,  0.5,   0, 0,    0,  0,  1,   // 1
     0.5,  0.5,  0.5,   1, 1,    0,  0,  1,   // 3
    -0.5,  0.5,  0.5,   0, 1,    0,  0,  1,   // 4
    -0.5, -0.5,  0.5,   0, 0,    0,  0,  1,   // 1
     0.5, -0.5,  0.5,   1, 0,    0,  0,  1,   // 2
     0.5,  0.5,  0.5,   1, 1,    0,  0,  1,   // 3
    // back
     0.5, -0.5, -0.5,   0, 0,    0,  0, -1,   // 6
    -0.5,  0.5, -0.5,   1, 1,    0,  0, -1,   // 8
     0.5,  0.5, -0.5,   0, 1,    0,  0, -1,   // 7
     0.5, -0.5, -0.5,   0, 0,    0,  0, -1,   // 6
    -0.5, -0.5, -0.5,   1, 0,    0,  0, -1,   // 5
    -0.5,  0.5, -0.5,   1, 1,    0,  0, -1,   // 8
    // top
    -0.5,  0.5,  0.5,   0, 0,    0,  1,  0,   // 4
     0.5,  0.5, -0.5,   1, 1,    0,  1,  0,   // 7
    -0.5,  0.5, -0.5,   0, 1,    0,  1,  0,   // 8
    -0.5,  0.5,  0.5,   0, 0,    0,  1,  0,   // 4
     0.5,  0.5,  0.5,   1, 0,    0,  1,  0,   // 3
     0.5,  0.5, -0.5,   1, 1,    0,  1,  0,   // 7
    // bottom
    -0.5, -0.5, -0.5,   0, 0,    0, -1,  0,   // 5
     0.5, -0.5,  0.5,   1, 1,    0, -1,  0,   // 2
    -0.5, -0.5,  0.5,   0, 1,    0, -1,  0,   // 1
    -0.5, -0.5, -0.5,   0, 0,    0, -1,  0,   // 5
     0.5, -0.5, -0.5,   1, 0,    0, -1,  0,   // 6
     0.5, -0.5,  0.5,   1, 1,    0, -1,  0,   // 2
    // left
    -0.5, -0.5, -0.5,   0, 0,   -1,  0,  0,   // 5
    -0.5,  0.5,  0.5,   1, 1,   -1,  0,  0,   // 4
    -0.5,  0.5, -0.5,   0, 1,   -1,  0,  0,   // 8
    -0.5, -0.5, -0.5,   0, 0,   -1,  0,  0,   // 5
    -0.5, -0.5,  0.5,   1, 0,   -1,  0,  0,   // 1
    -0.5,  0.5,  0.5,   1, 1,   -1,  0,  0,   // 4
    // right
     0.5, -0.5,  0.5,   0, 0,    1,  0,  0,   // 2
     0.5,  0.5, -0.5,   1, 1,    1,  0,  0,   // 7
     0.5,  0.5,  0.5,   0, 1,    1,  0,  0,   // 3
     0.5, -0.5,  0.5,   0, 0,    1,  0,  0,   // 2
     0.5, -0.5, -0.5,   1, 0,    1,  0,  0,   // 6
     0.5,  0.5, -0.5,   1, 1,    1,  0,  0,   // 7
  ]),
);

const stride = 32;
bindVertexAttribute("in_position", 3, gl.FLOAT, false, stride, 0);
bindVertexAttribute("in_texture_coords", 2, gl.FLOAT, false, stride, 12);
bindVertexAttribute("in_normal", 3, gl.FLOAT, false, stride, 20);

const world = World(64, 64, 16);

const blocks = world.blocks;
createBuffer(gl.ARRAY_BUFFER, new Float32Array(blocks.flat()));
const offset = gl.getAttribLocation(program, "in_offset");
bindVertexAttribute(offset, 3, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(offset, 1);

const input = Input();
const player = Player(input);

input.handleMouse(canvas);
canvas.onclick = () => canvas.requestPointerLock();

input.handleKeyboard({
  w: "forward",
  s: "backward",
  a: "left",
  d: "right",
});

const image = new Image();
image.src = new URL("dirt.png", import.meta.url);

image.onload = () => {
  gl.useProgram(program);

  const projection = gl.getUniformLocation(program, "u_projection");
  const aspect = gl.canvas.width / gl.canvas.height;
  gl.uniformMatrix4fv(projection, false, perspective(aspect, 60, 0.1, 100));

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const view = gl.getUniformLocation(program, "u_view");

  let prevTime;

  function render() {
    const now = performance.now();
    if (!prevTime) prevTime = now;

    player.update(now - prevTime);

    gl.uniformMatrix4fv(view, true, player.view);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, blocks.length);

    requestAnimationFrame(render);

    prevTime = now;
  }

  requestAnimationFrame(render);
};
