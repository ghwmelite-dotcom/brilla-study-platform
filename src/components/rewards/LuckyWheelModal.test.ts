import { describe, expect, it } from 'vitest';
import { getWheelTargetRotation } from './wheelRotation';

describe('getWheelTargetRotation', () => {
  it('centers the Worker-selected segment under the wheel pointer', () => {
    expect(getWheelTargetRotation(0, 0, 8) % 360).toBe(337.5);
    expect(getWheelTargetRotation(0, 7, 8) % 360).toBe(22.5);
  });

  it('always advances through full rotations from the current position', () => {
    const currentRotation = 337.5;
    const nextRotation = getWheelTargetRotation(currentRotation, 0, 8);
    expect(nextRotation).toBeGreaterThan(currentRotation);
    expect(nextRotation % 360).toBe(337.5);
  });

  it('rejects an invalid segment selection', () => {
    expect(() => getWheelTargetRotation(0, 8, 8)).toThrow(RangeError);
  });
});
