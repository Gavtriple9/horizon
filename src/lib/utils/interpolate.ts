export function clamp(value: number, lower: number, upper: number): number {
  if (!Number.isFinite(value)) {
    return lower;
  }
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }
  return Math.min(Math.max(value, lower), upper);
}

export function normalizeClamped(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return 0;
  }
  if (max === min) {
    return value >= max ? 1 : 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

export function lerp(start: number, end: number, t: number): number {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(t)) {
    return start;
  }
  return start + (end - start) * t;
}

