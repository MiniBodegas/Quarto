// src/api.js
export async function adminLogin(email, password) {
  const res = await fetch('http://localhost:3000/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}