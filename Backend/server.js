import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
})); 

app.use(express.json());
app.use(cookieParser());

// ======== HELPERS =======

const setCookies = (res, session) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };

    res.cookie('sb-access-token', session.access_token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('sb-refresh-token', session.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
};

const clearCookies = (res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
};

// ============== MIDDLEWARE DE AUTENTICACIÓN ===================

const authenticate = async (req, res, next) => {
    const token = req.cookies['sb-access-token'];

    if (!token) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    req.token = token;
    next();
};

// ========= AUTH ROUTES ======== 

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        
        setCookies(res, data.session);

        res.json({
            user: data.user,
            message: 'Login exitoso',
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}); 

// Backend: server.js
app.post('/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  // Busca el admin en la tabla
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Usuario no encontrado' });

  // Verifica la contraseña (usa bcrypt si está hasheada)
  if (data.password !== password) return res.status(401).json({ error: 'Contraseña incorrecta' });

  // Aquí puedes crear una sesión o token si lo necesitas
  res.json({ success: true, admin: data });
});

// Register
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
            },
        });

        if (error) throw error;

        res.json({ 
            message: 'Registro exitoso. Verifica tu email.',
            user: data.user,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Logout
app.post('/auth/logout', authenticate, async (req, res) => {
    try {
        await supabase.auth.admin.signOut(req.token);
        clearCookies(res);
        res.json({ message: 'Logout exitoso' });
    } catch (error) {
        clearCookies(res);
        res.status(200).json({ message: 'Logout completado' });
    }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
    try { 
        const refreshToken = req.cookies['sb-refresh-token'];

        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token' });
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });
        
        if (error) throw error;
        
        setCookies(res, data.session);
        res.json({ message: 'Token refrescado' });
    } catch (error) {
        clearCookies(res);
        res.status(401).json({ error: error.message });
    }
});

// Get Current session
app.get('/auth/session', authenticate, async (req, res) => {
    try { 
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        res.json({
            user: req.user,
            profile: profile || null,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PROTECTED ROUTES ============

// Facturas
app.get('/api/invoices', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('company_id', req.user.id)
            .order('issue_date', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inventario 
app.get('/api/inventory', authenticate, async (req, res) => {
    try { 
        const { data, error } = await supabase 
            .from('inventory_items')
            .select('*')
            .eq('company_id', req.user.id);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Personas autorizadas
app.get('/api/authorized-persons', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('authorized_persons')
            .select('*')
            .eq('company_id', req.user.id);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =========== START SERVER ===========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});