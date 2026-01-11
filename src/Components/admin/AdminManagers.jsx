import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { createAdmin, getAdmins } from '../../api';

const AdminManagers = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        name: '',
    });

    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const res = await getAdmins();
            if (res.success) {
                setAdmins(res.data || []);
            } else {
                setError('Error al cargar administradores');
            }
        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFormError('');
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.name) {
            setFormError('Todos los campos son requeridos');
            return false;
        }

        if (!formData.email.includes('@')) {
            setFormError('Email inválido');
            return false;
        }

        if (formData.password.length < 6) {
            setFormError('Contraseña debe tener al menos 6 caracteres');
            return false;
        }

        if (formData.password !== formData.passwordConfirm) {
            setFormError('Las contraseñas no coinciden');
            return false;
        }

        // Validar que el email no exista ya
        if (admins.some(admin => admin.email === formData.email)) {
            setFormError('Este email ya está registrado como administrador');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            setFormError('');
            setSuccess('');

            const res = await createAdmin(formData.email, formData.password, formData.name);

            if (res.success) {
                setSuccess('✅ Administrador creado exitosamente');
                setFormData({
                    email: '',
                    password: '',
                    passwordConfirm: '',
                    name: '',
                });
                setShowForm(false);
                loadAdmins();
            } else {
                setFormError(res.message || 'Error al crear administrador');
            }
        } catch (err) {
            setFormError('Error: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-8 flex items-center justify-center">
                <Spinner />
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestión de Administradores</h1>
                <p className="text-text-secondary mt-1">Crea y gestiona las cuentas de administrador.</p>
            </div>

            {error && (
                <Card className="mb-6 p-4 bg-red-50 border border-red-200">
                    <p className="text-red-700">{error}</p>
                </Card>
            )}

            {success && (
                <Card className="mb-6 p-4 bg-green-50 border border-green-200">
                    <p className="text-green-700">{success}</p>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Formulario */}
                <Card className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-text-primary">
                            {showForm ? 'Nuevo Administrador' : 'Crear Admin'}
                        </h2>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <span className="material-symbols-outlined text-primary">add</span>
                            </button>
                        )}
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700">{formError}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-text-primary mb-1">
                                    Nombre
                                </label>
                                <Input
                                    type="text"
                                    name="name"
                                    placeholder="Juan Pérez"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-primary mb-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-primary mb-1">
                                    Contraseña
                                </label>
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-text-secondary mt-1">
                                    Mínimo 6 caracteres
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-primary mb-1">
                                    Confirmar Contraseña
                                </label>
                                <Input
                                    type="password"
                                    name="passwordConfirm"
                                    placeholder="••••••••"
                                    value={formData.passwordConfirm}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    className="flex-1 py-2 text-sm"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creando...' : 'Crear'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setFormError('');
                                        setFormData({
                                            email: '',
                                            password: '',
                                            passwordConfirm: '',
                                            name: '',
                                        });
                                    }}
                                    className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </Card>

                {/* Lista de Admins */}
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">
                        Administradores Registrados
                    </h2>

                    {admins.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {admins.map((admin, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-border">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-text-primary">{admin.name}</p>
                                            <p className="text-sm text-text-secondary">{admin.email}</p>
                                            {admin.created_at && (
                                                <p className="text-xs text-text-secondary mt-1">
                                                    Creado: {new Date(admin.created_at).toLocaleDateString('es-CO')}
                                                </p>
                                            )}
                                        </div>
                                        <span className="material-symbols-outlined text-green-600 text-xl">
                                            check_circle
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-secondary py-8">
                            No hay administradores registrados
                        </p>
                    )}

                    <p className="text-xs text-text-secondary mt-4">
                        Total: {admins.length} administrador{admins.length !== 1 ? 'es' : ''}
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AdminManagers;
