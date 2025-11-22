export interface Vector2 {
  x: number;
  y: number;
}

export const wrapPosition = (value: number, limit: number): number => {
  if (limit <= 0) {
    throw new Error('limit must be greater than zero');
  }
  let wrapped = value % limit;
  if (wrapped < 0) {
    wrapped += limit;
  }
  return wrapped;
};

export const addVectors = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y
});

export const scaleVector = (a: Vector2, scalar: number): Vector2 => ({
  x: a.x * scalar,
  y: a.y * scalar
});

export const limitMagnitude = (vector: Vector2, maxMagnitude: number): Vector2 => {
  const mag = Math.hypot(vector.x, vector.y);
  if (mag === 0 || mag <= maxMagnitude) {
    return vector;
  }
  const ratio = maxMagnitude / mag;
  return scaleVector(vector, ratio);
};

export const angleToVector = (angle: number, magnitude = 1): Vector2 => {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude
  };
};
