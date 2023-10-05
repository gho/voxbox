export function radians(degrees) {
  return degrees * 0.01745329251;
}

export function v3(x, y, z) {
  return new V3(x, y, z);
}

class V3 {
  constructor(x=0, y=0, z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v)   { return new V3(this.x+v.x, this.y+v.y, this.z+v.z); }
  sub(v)   { return new V3(this.x-v.x, this.y-v.y, this.z-v.z); }
  mul(c)   { return new V3(this.x*c, this.y*c, this.z*c); }
  negate() { return new V3(-this.x, -this.y, -this.z); }
  dot(v)   { return this.x*v.x + this.y*v.y + this.z*v.z; }

  cross(v) {
    return new V3(
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
    );
  }

  norm() {
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
  }

  unit() {
    const len = this.norm();
    return new V3(this.x/len, this.y/len, this.z/len);
  }

  iadd(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
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
  const target = eye.add(center);
  const f = target.sub(eye).unit();
  const s = f.cross(up).unit();
  const u = s.cross(f);
  return [
    s.x, s.y, s.z, -s.dot(eye),
    u.x, u.y, u.z, -u.dot(eye),
    -f.x, -f.y, -f.z, f.dot(eye),
    0, 0, 0, 1,
  ];
}
