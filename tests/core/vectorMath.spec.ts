import { addVectors, angleToVector, limitMagnitude, scaleVector, wrapPosition } from '@core/vectorMath';

describe('vector math helpers', () => {
  it('wraps positive values within limit', () => {
    expect(wrapPosition(970, 960)).toBe(10);
  });

  it('wraps negative values to positive range', () => {
    expect(wrapPosition(-5, 960)).toBe(955);
  });

  it('adds vectors', () => {
    expect(addVectors({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  it('scales vectors', () => {
    expect(scaleVector({ x: 2, y: -4 }, 0.5)).toEqual({ x: 1, y: -2 });
  });

  it('limits magnitudes correctly', () => {
    const limited = limitMagnitude({ x: 6, y: 8 }, 5);
    expect(Number(limited.x.toFixed(2))).toBeCloseTo(3);
    expect(Number(limited.y.toFixed(2))).toBeCloseTo(4);
  });

  it('converts angles to vectors', () => {
    const vector = angleToVector(Math.PI / 2, 2);
    expect(Number(vector.x.toFixed(2))).toBeCloseTo(0);
    expect(Number(vector.y.toFixed(2))).toBeCloseTo(2);
  });
});
