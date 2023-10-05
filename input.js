const minPitch = -89;
const maxPitch =  89;
const rotationSpeed = 0.15;

export default function Input() {
  let pitch = 0;
  let yaw = 90;
  const state = {};

  return {
    get pitch() { return pitch; },
    get yaw()   { return yaw; },

    handleMouse(target) {
      function handleMouseMove(event) {
        yaw += event.movementX * rotationSpeed;
        if (Math.abs(yaw) > 360) yaw = 0;

        pitch -= event.movementY * rotationSpeed;
        if (pitch > maxPitch) pitch = maxPitch;
        if (pitch < minPitch) pitch = minPitch;
      }

      document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === target) {
          document.addEventListener("mousemove", handleMouseMove);
        } else {
          document.removeEventListener("mousemove", handleMouseMove);
        }
      });
    },

    handleKeyboard(keys) {
      function handleKey({key, type}) {
        if (keys[key]) {
          state[keys[key]] = type === "keydown";
        }
      }

      document.addEventListener("keydown", handleKey);
      document.addEventListener("keyup", handleKey);

      for (const key of Object.values(keys)) {
        state[key] = false;
        Object.defineProperty(this, key, {
          get: () => state[key] || false,
        });
      }
    },
  };
}
