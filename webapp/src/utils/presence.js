export function isUserOnline(lastSeenAt, thresholdMinutes = 1) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Date.now() - t < thresholdMinutes * 60 * 1000;
}