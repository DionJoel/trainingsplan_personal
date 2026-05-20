export async function sendChat(prompt, clientContext) {
  const body = { prompt };
  if (clientContext) {
    body.clientContext = clientContext;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Chat-Request fehlgeschlagen');
  }

  return response.json();
}
