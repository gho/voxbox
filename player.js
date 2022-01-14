import {lookAt, radians, v3} from "./math.js";

export default function Player(input) {
  const up = v3(0, 1, 0);
  let position = v3(3, 7, 7);
  let direction = v3(1, 0, 0);

  return {
    get view() {
      return lookAt(position, direction, up);
    },

    update() {
      const pitch = radians(input.pitch);
      const yaw = radians(input.yaw);
      const cosPitch = Math.cos(pitch);
      direction = v3(
        Math.cos(yaw) * cosPitch,
        Math.sin(pitch),
        Math.sin(yaw) * cosPitch,
      ).unit();

      const heading = v3(0, 0, 0);
      if (input.forward)  heading.iadd(direction);
      if (input.backward) heading.iadd(direction.negate());
      if (input.left)     heading.iadd(direction.cross(up).unit().negate());
      if (input.right)    heading.iadd(direction.cross(up).unit());

      position = position.add(heading.mul(0.1));
    },
  };
}
