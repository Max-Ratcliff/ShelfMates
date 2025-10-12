import { auth } from './firebase';

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  return await user.getIdToken();
};

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const token = await getAuthToken();
    const response = await fetch(import.meta.env.VITE_API_BASE_URL + url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  },

  async post<T>(url: string, data: any): Promise<T> {
    const token = await getAuthToken();
    const response = await fetch(import.meta.env.VITE_API_BASE_URL + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  },
  // Add other methods like get, put, delete as needed
};