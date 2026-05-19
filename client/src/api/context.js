export async function fetchContext() {
  const response = await fetch('/api/context');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Context request failed');
  }
  return response.json();
}
