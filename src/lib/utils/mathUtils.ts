/**
 * Returns a random number between min and max (inclusive)
 */
export function randomBetween(_min: number, _max: number): number {
  return Math.random() * (_max - _min) + _min;
}

/**
 * Convert degrees to radians
 */
export function degToRad(_degrees: number): number {
  return _degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(_radians: number): number {
  return _radians * (180 / Math.PI);
}

/**
 * Clamps a value between min and max
 */
export function clamp(_value: number, _min: number, _max: number): number {
  return Math.min(Math.max(_value, _min), _max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(_start: number, _end: number, _t: number): number {
  return _start * (1 - _t) + _end * _t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  _value: number,
  _inputMin: number,
  _inputMax: number,
  _outputMin: number,
  _outputMax: number
): number {
  const t = (_value - _inputMin) / (_inputMax - _inputMin);
  return lerp(_outputMin, _outputMax, t);
}

/**
 * Calculate distance between two points
 */
export function distance(_x1: number, _y1: number, _x2: number, _y2: number): number {
  return Math.sqrt(Math.pow(_x2 - _x1, 2) + Math.pow(_y2 - _y1, 2));
}

/**
 * Generate a random color
 */
export function randomColor(): string {
  return `hsl(${Math.round(Math.random() * 360)}, ${Math.round(
    Math.random() * 50 + 50
  )}%, ${Math.round(Math.random() * 30 + 50)}%)`;
}