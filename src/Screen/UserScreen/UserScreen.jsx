import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Portal } from "../../Components/index";
import { supabase } from "../../supabase";

const UserScreen = () => {
  const navigate = useNavigate();
  
  // Estados de sesión
  const [loggedInCompanyProfile, setLoggedInCompanyProfile] = useState(null);
  const [loginUser, setLoginUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecentLogin, setIsRecentLogin] = useState(false);

  // Estados de datos del usuario
  const [userInvoices, setUserInvoices] = useState([]);
  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [userInventoryLogs, setUserInventoryLogs] = useState([]);
  const [userStorageUnits, setUserStorageUnits] = useState([]);

  // Estado de notificaciones
  const [notifications, setNotifications] = useState([]);

  // ============================================
  // FUNCIÓN DE NOTIFICACIÓN
  // ============================================
  const addNotification = useCallback((type, message) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // ============================================
  // VERIFICAR AUTENTICACIÓN Y CARGAR DATOS
  // ============================================
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);

        // 1. Verificar si hay sesión activa en Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("[UserScreen] No hay sesión activa, redirigiendo al login");
          navigate('/login'); // Redirigir al login
          return;
        }

        const userEmail = session.user.email;
        console.log("[UserScreen] Usuario autenticado:", userEmail);

        // 2. Obtener datos del usuario desde la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (userError || !userData) {
          console.error("[UserScreen] Error obteniendo usuario:", userError);
          addNotification('error', 'No se pudieron cargar los datos del usuario');
          navigate('/login');
          return;
        }

        // Configurar perfil del usuario
        const userProfile = {
          id: userData.id,
          type: 'individual', // Por defecto individual, puedes ajustar según tu lógica
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
        };

        setLoggedInCompanyProfile(userProfile);
        setLoginUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
        });

        // Verificar login reciente
        const now = Date.now();
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        const thirtyMinutes = 30 * 60 * 1000;
        setIsRecentLogin(lastLoginTime ? (now - parseInt(lastLoginTime, 10)) < thirtyMinutes : true);
        localStorage.setItem('lastLoginTime', now.toString());

        // 3. Cargar todos los datos del usuario
        await loadUserData(userData.id);

        addNotification('success', `Bienvenido, ${userData.name}`);
      } catch (error) {
        console.error("[UserScreen] Error en inicialización:", error);
        addNotification('error', 'Error al cargar los datos');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [navigate, addNotification]);

  // ============================================
  // CARGAR DATOS DEL USUARIO
  // ============================================
  const loadUserData = async (userId) => {
    try {
      console.log("[UserScreen] Cargando datos para usuario:", userId);

      // Cargar bookings (facturas)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!bookingsError && bookings) {
        // Mapear bookings a formato de facturas
        const invoices = bookings.map(booking => ({
          id: booking.id,
          company_id: userId,
          amount: booking.amount_total || 0,
          status: booking.payment_status === 'APPROVED' ? 'paid' : 'pending',
          date: booking.created_at,
          reference: booking.wompi_reference,
          description: `Servicio de almacenamiento - ${booking.storage_months || 1} mes(es)`,
        }));
        setUserInvoices(invoices);
      }

      // Cargar inventario
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!inventoryError && inventory) {
        setUserInventory(inventory);
      }

      // TODO: Cargar personas autorizadas cuando se implemente la tabla
      // Por ahora dejamos vacío
      setAuthorizedPersons([]);

      // TODO: Cargar logs de inventario cuando se implemente la tabla
      setUserInventoryLogs([]);

      // TODO: Cargar unidades de almacenamiento cuando se implemente la tabla
      setUserStorageUnits([]);

      // Para usuarios individuales, no hay otros usuarios en la "empresa"
      setCompanyUsers([{
        id: userId,
        name: loginUser?.name || '',
        email: loginUser?.email || '',
      }]);

      console.log("[UserScreen] ✅ Datos cargados correctamente");
    } catch (error) {
      console.error("[UserScreen] Error cargando datos:", error);
      addNotification('error', 'Error al cargar algunos datos');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('lastLoginTime');
      addNotification('info', 'Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error("[UserScreen] Error cerrando sesión:", error);
      addNotification('error', 'Error al cerrar sesión');
    }
  }, [navigate, addNotification]);

  const handleUpdateInvoice = useCallback(async (invoiceToUpdate) => {
    try {
      // Actualizar el booking en Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'APPROVED' })
        .eq('id', invoiceToUpdate.id);

      if (error) throw error;

      // Actualizar estado local
      setUserInvoices(current =>
        current.map(inv =>
          inv.id === invoiceToUpdate.id ? { ...inv, status: 'paid' } : inv
        )
      );

      addNotification('success', 'Factura actualizada correctamente');
    } catch (error) {
      console.error("[UserScreen] Error actualizando factura:", error);
      addNotification('error', 'Error al actualizar la factura');
    }
  }, [addNotification]);

  const handleUpdateMultipleInvoices = useCallback(async (invoiceIds) => {
    try {
      // Actualizar múltiples bookings en Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'APPROVED' })
        .in('id', invoiceIds);

      if (error) throw error;

      // Actualizar estado local
      setUserInvoices(current =>
        current.map(inv =>
          invoiceIds.includes(inv.id) ? { ...inv, status: 'paid' } : inv
        )
      );

      addNotification('success', `${invoiceIds.length} facturas actualizadas`);
    } catch (error) {
      console.error("[UserScreen] Error actualizando facturas:", error);
      addNotification('error', 'Error al actualizar las facturas');
    }
  }, [addNotification]);

  const handleUpdateProfile = useCallback(async (updatedProfile) => {
    try {
      if (!loggedInCompanyProfile) return;

      // Actualizar en Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedProfile.name,
          phone: updatedProfile.phone,
        })
        .eq('id', loggedInCompanyProfile.id);

      if (error) throw error;

      // Actualizar estado local
      setLoggedInCompanyProfile(updatedProfile);
      setLoginUser(prev => ({
        ...prev,
        name: updatedProfile.name,
      }));

      addNotification('success', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error("[UserScreen] Error actualizando perfil:", error);
      addNotification('error', 'Error al actualizar el perfil');
    }
  }, [loggedInCompanyProfile, addNotification]);

  const handleAddPerson = useCallback(async (name, documentId) => {
    // TODO: Implementar cuando se cree la tabla de personas autorizadas
    console.log("[UserScreen] TODO: Agregar persona autorizada", { name, documentId });
    addNotification('info', 'Función en desarrollo');
  }, [addNotification]);

  const handleRemovePerson = useCallback(async (personId) => {
    // TODO: Implementar cuando se cree la tabla de personas autorizadas
    console.log("[UserScreen] TODO: Remover persona autorizada", personId);
    addNotification('info', 'Función en desarrollo');
  }, [addNotification]);

  const handleAddUser = useCallback(async (userData) => {
    // Para usuarios individuales, esta función no aplica
    console.log("[UserScreen] Agregar usuarios no disponible para cuentas individuales");
    addNotification('info', 'Esta función solo está disponible para empresas');
  }, [addNotification]);

  const handleRemoveUser = useCallback(async (userId) => {
    // Para usuarios individuales, esta función no aplica
    console.log("[UserScreen] Remover usuarios no disponible para cuentas individuales");
    addNotification('info', 'Esta función solo está disponible para empresas');
  }, [addNotification]);

  const handleInventoryMovement = useCallback(async (companyId, unitId, itemData, qty, action, userName, notes) => {
    try {
      // TODO: Implementar cuando se cree la tabla de movimientos de inventario
      console.log("[UserScreen] TODO: Movimiento de inventario", {
        companyId,
        unitId,
        itemData,
        qty,
        action,
        userName,
        notes
      });
      addNotification('info', 'Función de movimientos en desarrollo');
    } catch (error) {
      console.error("[UserScreen] Error en movimiento de inventario:", error);
      addNotification('error', 'Error al registrar el movimiento');
    }
  }, [addNotification]);

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!loggedInCompanyProfile || !loginUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-text-secondary">No se pudo cargar el usuario</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Portal
      company={loggedInCompanyProfile}
      loginUser={loginUser}
      invoices={userInvoices}
      authorizedPersons={authorizedPersons}
      users={companyUsers}
      userInventory={userInventory}
      userInventoryLogs={userInventoryLogs}
      userStorageUnits={userStorageUnits}
      onSignOut={handleSignOut}
      onUpdateInvoice={handleUpdateInvoice}
      onUpdateMultipleInvoices={handleUpdateMultipleInvoices}
      onUpdateProfile={handleUpdateProfile}
      onAddPerson={handleAddPerson}
      onRemovePerson={handleRemovePerson}
      onAddUser={handleAddUser}
      onRemoveUser={handleRemoveUser}
      onInventoryMovement={handleInventoryMovement}
      isRecentLogin={isRecentLogin}
      addNotification={addNotification}
    />
  );
};

export default UserScreen;