// Avoid TypeScript errors without vite/client types by casting import.meta
export const API_BASE: string = ((import.meta as any)?.env?.VITE_API_BASE as string) || 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('token');
}
export function setToken(token: string) {
  localStorage.setItem('token', token);
}
export function clearToken() {
  localStorage.removeItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (data: { name: string; email: string; password: string; }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string; }) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/me'),
  updateMe: (data: { name?: string; avatar?: string }) => request('/me', { method: 'PUT', body: JSON.stringify(data) }),
  createRoom: () => request('/rooms', { method: 'POST' }),
  joinRoom: (code: string) => request('/rooms/join', { method: 'POST', body: JSON.stringify({ code }) }),
  getRoom: (code: string) => request(`/rooms/${code}`),
  startRoom: (code: string) => request(`/rooms/${code}/start`, { method: 'POST' }),
  restartRoom: (code: string) => request(`/rooms/${code}/restart`, { method: 'POST' }),
  getGameState: (code: string) => request(`/rooms/${code}/game`),
  playCard: (code: string, cardId: string) => request(`/rooms/${code}/game/play`, { method: 'POST', body: JSON.stringify({ cardId }) }),
  leaveGame: (code: string) => request(`/rooms/${code}/game/leave`, { method: 'POST' }),
};
