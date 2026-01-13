// src/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function adminLogin(email, password) {
  const res = await fetch(`${API_URL}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function createAdmin(email, password, name) {
  const res = await fetch(`${API_URL}/auth/admin-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

export async function getAdmins() {
  const res = await fetch(`${API_URL}/auth/admins`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getUsersWithBookings() {
  const res = await fetch(`${API_URL}/api/admin/users-with-bookings`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getInvoicesWithUsers() {
  const res = await fetch(`${API_URL}/api/admin/invoices-with-users`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getStorageByUser() {
  const res = await fetch(`${API_URL}/api/admin/storage-by-user`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getClientsComplete() {
  const res = await fetch(`${API_URL}/api/admin/clients-complete`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function getInventoryByUser(userId) {
  const res = await fetch(`${API_URL}/api/admin/inventory-by-user/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}