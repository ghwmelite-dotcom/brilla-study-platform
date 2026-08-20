export function getWheelTargetRotation(
  currentRotation: number,
  selectedIndex: number,
  segmentCount: number,
): number {
  if (segmentCount <= 0 || selectedIndex < 0 || selectedIndex >= segmentCount) {
    throw new RangeError('Invalid wheel segment selection');
  }
  const segmentAngle = 360 / segmentCount;
  const targetCenterAngle = selectedIndex * segmentAngle + segmentAngle / 2;
  const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
  const targetRotation = (360 - targetCenterAngle) % 360;
  return currentRotation + 5 * 360 + ((targetRotation - normalizedCurrent + 360) % 360);
}
