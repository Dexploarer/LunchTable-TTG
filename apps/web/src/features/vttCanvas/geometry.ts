export function clampPercent(value: number, min = 2, max = 98) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function clientPointToPercent(
  point: { clientX: number; clientY: number },
  bounds: { left: number; top: number; width: number; height: number },
) {
  const width = bounds.width || 1;
  const height = bounds.height || 1;

  return {
    x: ((point.clientX - bounds.left) / width) * 100,
    y: ((point.clientY - bounds.top) / height) * 100,
  };
}
