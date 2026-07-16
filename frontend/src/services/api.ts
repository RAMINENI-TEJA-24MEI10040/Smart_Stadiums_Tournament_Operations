const getHeaders = () => {
  const token = localStorage.getItem('stadium-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API request failed');
    }
    const payload = await res.json();
    return payload.data as T;
  },

  async post<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API request failed');
    }
    const payload = await res.json();
    return payload.data as T;
  },

  async patch<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API request failed');
    }
    const payload = await res.json();
    return payload.data as T;
  },

  async put<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API request failed');
    }
    const payload = await res.json();
    return payload.data as T;
  }
};
