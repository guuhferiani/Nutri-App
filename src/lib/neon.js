import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);

// Função auxiliar para chamadas na Data API do Neon
export const fetchNeonDataAPI = async (endpoint, options = {}) => {
  const sessionResult = await authClient.getSession();
  const token = sessionResult.data?.session?.token;

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${import.meta.env.VITE_NEON_DATA_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });

  return response.json();
};
