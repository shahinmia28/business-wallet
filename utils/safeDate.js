export function safeISODate(date) {
  try {
    const d = new Date(date);
    if (isNaN(d)) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}
