const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function apiPost<T, B = unknown>(endpoint: string, body: B): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${endpoint} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}
