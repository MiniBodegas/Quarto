// src/api.js
export async function adminLogin(email, password) {
  const res = await fetch('http://localhost:3000/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getUsersWithBookings() {
  const res = await fetch('http://localhost:3000/api/admin/users-with-bookings', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getInvoicesWithUsers() {
  const res = await fetch('http://localhost:3000/api/admin/invoices-with-users', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getStorageByUser() {
  const res = await fetch('http://localhost:3000/api/admin/storage-by-user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getClientsComplete() {
  const res = await fetch('http://localhost:3000/api/admin/clients-complete', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}