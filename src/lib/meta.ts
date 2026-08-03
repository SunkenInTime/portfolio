/** Post meta formatting matching the old Hugo theme ("January 2, 2006" · "N min"). */

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** Hugo's .ReadingTime: word count at 213 wpm, rounded up. */
export function readingTime(body: string | undefined): string {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 213))} min`;
}
