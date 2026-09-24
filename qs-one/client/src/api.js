// Small fetch wrapper. The demo identity header stands in for sign-in.
const KEY = 'qs-one-demo-user';

export function getUser() {
  try { return localStorage.getItem(KEY) || 'u1'; } catch { return 'u1'; }
}
export function setUser(id) {
  try { localStorage.setItem(KEY, id); } catch { /* private mode */ }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-demo-user': getUser() },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
