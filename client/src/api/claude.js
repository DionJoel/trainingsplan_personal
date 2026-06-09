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

  const result = await response.json();
  if (result && typeof result.content === 'object') {
    result.content = JSON.stringify(result.content, null, 2);
  }
  return result;
}
