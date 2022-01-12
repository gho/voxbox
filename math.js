export function radians(degrees) {
  return degrees * 0.01745329251;
}

export function add(x, y) {
  return [x[0]+y[0], x[1]+y[1], x[2]+y[2]];
}

function sub(x, y) {
  return [x[0]-y[0], x[1]-y[1], x[2]-y[2]];
}

export function mul(x, c) {
  return [x[0]*c, x[1]*c, x[2]*c];
}

export function negate(x) {
  return [-x[0], -x[1], -x[2]];
}

export function norm(x) {
  const len = Math.sqrt(x[0]**2 + x[1]**2 + x[2]**2);
  return [x[0]/len, x[1]/len, x[2]/len];
}

export function cross(x, y) {
  return [
    x[1]*y[2] - x[2]*y[1],
    x[2]*y[0] - x[0]*y[2],
    x[0]*y[1] - x[1]*y[0],
  ];
}

function dot(x, y) {
  return x[0]*y[0] + x[1]*y[1] + x[2]*y[2];
}

export function perspective(aspect, fovy, near, far) {
  const f = Math.tan(1.57079632679 - radians(fovy)/2);
  return [
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near+far) / (near-far), -1,
    0, 0, 2*near*far / (near-far), 0,
  ];
}

export function lookAt(eye, center, up) {
  const target = add(eye, center);
  const f = norm(sub(target, eye));
  const s = norm(cross(f, up));
  const u = cross(s, f);
  return [
    s[0], s[1], s[2], -dot(s, eye),
    u[0], u[1], u[2], -dot(u, eye),
    -f[0], -f[1], -f[2], dot(f, eye),
    0, 0, 0, 1,
  ];
}
