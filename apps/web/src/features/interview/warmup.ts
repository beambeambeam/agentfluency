export const warmupRemaining = (startedAt: Date, now = Date.now()) =>
  Math.max(0, startedAt.getTime() + 3 * 60_000 - now);
