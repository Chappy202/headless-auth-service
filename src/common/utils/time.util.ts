export function parseTimeToSeconds(time: string): number {
  if (!time || typeof time !== 'string') {
    throw new Error(`Invalid time value: ${time}`);
  }

  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);

  if (isNaN(value)) {
    throw new Error(`Invalid time value: ${time}`);
  }

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}
