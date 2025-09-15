export function formatDistanceToNow(
  date: Date,
  options?: { addSuffix?: boolean }
): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  let result: string;

  if (diffInMinutes < 1) {
    result = 'less than a minute';
  } else if (diffInMinutes < 60) {
    result = `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}`;
  } else if (diffInHours < 24) {
    result = `${diffInHours} hour${diffInHours === 1 ? '' : 's'}`;
  } else if (diffInDays < 30) {
    result = `${diffInDays} day${diffInDays === 1 ? '' : 's'}`;
  } else {
    // For longer periods, use a simple format
    const diffInMonths = Math.floor(diffInDays / 30);
    result = `${diffInMonths} month${diffInMonths === 1 ? '' : 's'}`;
  }

  return options?.addSuffix ? `${result} ago` : result;
}
