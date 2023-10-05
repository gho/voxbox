// https://mrl.cs.nyu.edu/~perlin/noise/
// https://www.youtube.com/playlist?list=PLFt_AvWsXl0eBW2EiBtl_sxmDtSgZBxB3

let p = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,
  142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,
  203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
  74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,
  220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,
  132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,
  186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,
  206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,
  163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,
  224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,
  179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
  184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,
  24,72,243,141,128,195,78,66,215,61,156,180
];

p = Object.freeze(p.concat(p));

function fade(x) {
  return ((6*x-15)*x + 10) * x**3;
}

function lerp(t, a, b) {
  return a + (b-a)*t;
}

function grad(h, x, y, z) {
  h = h & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x, y, z) {
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);

  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  x = (x - xf) & 255;
  y = (y - yf) & 255;
  z = (z - zf) & 255;

  const a = p[x] + y;
  const aa = p[a] + z;
  const ab = p[a+1] + z;
  const b = p[x+1] + y;
  const ba = p[b] + z;
  const bb = p[b+1] + z;

  return lerp(w,
    lerp(v,
      lerp(u,
        grad(p[aa], xf, yf, zf),
        grad(p[ba], xf-1, yf, zf),
      ),
      lerp(u,
        grad(p[ab], xf, yf-1, zf),
        grad(p[bb], xf-1, yf-1, zf),
      )
    ),
    lerp(v,
      lerp(u,
        grad(p[aa+1], xf, yf, zf-1),
        grad(p[ba+1], xf-1, yf, zf-1),
      ),
      lerp(u,
        grad(p[ab+1], xf, yf-1, zf-1),
        grad(p[bb+1], xf-1, yf-1, zf-1),
      ),
    ),
  );
}

const scale = 96.3;
const octaves = 4;
const lacunarity = 2;
const persistence = 0.5

function noise(x, y) {
  let result = 0;
  let amplitude = 1;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const sx = x / scale * frequency;
    const sy = y / scale * frequency;
    result += perlin(sx, sy, 0) * amplitude;
    frequency *= lacunarity;
    amplitude *= persistence;
  }
  return result;
};

function generateTerrain(width, depth) {
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;

  const heights = new Array(width * depth);
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const height = noise(x, z);
      if (height > max) max = height;
      if (height < min) min = height;
      heights[z*width + x] = height;
    }
  }

  return heights.map(h => (h-min) / (max-min));
};

class Block {
  static EMPTY = Symbol("EMPTY");
  static DIRT  = Symbol("DIRT");

  constructor(type) {
    this.type = type;
  }

  get isTransparent() {
    return this.type === Block.EMPTY;
  }
}

export default function World(width, height, depth) {
  //  z:depth
  //  | y:height
  //  |/
  //  +--x:width
  const blocks = [];

  function index(x, y, z) {
    return x*height*depth + y*depth + z;
  }

  const terrain = generateTerrain(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const d = terrain[x*width + y] * depth;
      for (let z = 0; z < depth; z++) {
        const type = z > d ? Block.EMPTY : Block.DIRT;
        blocks[index(x, y, z)] = new Block(type);
      }
    }
  }

  return {
    get blocks() {
      return blocks
        .map((block, index) => {
          if (block.isTransparent) return null;
          const x = Math.floor(index / (height*depth));
          const remainder = index - (x*height*depth);
          return [x, Math.floor(remainder/depth), remainder%depth];
        })
        .filter(x => x);
    },

    blockAt(position) {
      return blocks[index(position.x, position.y, position.z)];
    }
  };
}
