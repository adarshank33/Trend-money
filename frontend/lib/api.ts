const API = process.env.NEXT_PUBLIC_API_URL;

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.message || 'Request failed'
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data;
}

export { API };
