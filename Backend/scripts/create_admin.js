#!/usr/bin/env node

/**
 * Script para crear admins en la base de datos
 * Uso: node scripts/create_admin.js <email> <password> <nombre>
 * 
 * Ejemplo:
 * node scripts/create_admin.js admin@quarto.com password123 "Administrador"
 * node scripts/create_admin.js juanestebanrp123@gmail.com tusecretpass "Juan"
 */

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Uso: node scripts/create_admin.js <email> <password> [nombre]');
  console.error('   Ejemplo: node scripts/create_admin.js admin@quarto.com password123 "Admin"');
  process.exit(1);
}

const email = args[0];
const password = args[1];
const name = args[2] || 'Administrador';

// Validar email
if (!email.includes('@')) {
  console.error('❌ Email inválido');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ Contraseña debe tener al menos 6 caracteres');
  process.exit(1);
}

async function createAdmin() {
  try {
    console.log('🔒 Hasheando contraseña...');
    const password_hash = await bcrypt.hash(password, 10); // 10 salt rounds

    console.log(`📝 Creando admin: ${email}`);
    const { data, error } = await supabase
      .from('admins')
      .insert({
        email,
        password: password_hash,
        name,
      })
      .select();

    if (error) {
      if (error.message.includes('unique constraint')) {
        console.error(`❌ El email ${email} ya existe`);
      } else {
        console.error('❌ Error:', error.message);
      }
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ No se pudo crear el admin');
      process.exit(1);
    }

    console.log('✅ Admin creado exitosamente:');
    console.log(`   Email: ${data[0].email}`);
    console.log(`   Nombre: ${data[0].name}`);
    console.log(`   ID: ${data[0].id}`);
    console.log(`   Fecha creación: ${data[0].created_at}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
