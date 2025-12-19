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
        let userData = null;
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (userError) {
          console.error("[UserScreen] Error consultando usuario:", userError);
          addNotification('error', 'Error al consultar los datos del usuario');
          navigate('/login');
          return;
        }

        if (!existingUser) {
          // Usuario no existe en la tabla users, crearlo
          console.log("[UserScreen] Usuario no existe en tabla users, creando...");
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              email: userEmail,
              name: session.user.user_metadata?.name || userEmail.split('@')[0],
              phone: session.user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
            }])
            .select()
            .single();

          if (createError) {
            console.error("[UserScreen] Error creando usuario:", createError);
            addNotification('error', 'Error al crear el usuario en la base de datos');
            navigate('/login');
            return;
          }

          userData = newUser;
          console.log("[UserScreen] ✅ Usuario creado en tabla users");
        } else {
          userData = existingUser;
          console.log("[UserScreen] ✅ Usuario encontrado en tabla users");
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

      // Obtener el email del usuario
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;

      // Cargar bookings (facturas) - buscar por user_id O por email
      let bookings = [];
      
      // 1. Buscar por user_id (bookings ya asociados)
      const { data: bookingsByUserId, error: bookingsError1 } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!bookingsError1 && bookingsByUserId) {
        bookings = [...bookingsByUserId];
      }

      // 2. Buscar por email (bookings sin user_id pero con el mismo email)
      if (userEmail) {
        const { data: bookingsByEmail, error: bookingsError2 } = await supabase
          .from('bookings')
          .select('*')
          .eq('email', userEmail)
          .is('user_id', null)
          .order('created_at', { ascending: false });

        if (!bookingsError2 && bookingsByEmail && bookingsByEmail.length > 0) {
          console.log("[UserScreen] Bookings encontrados por email:", bookingsByEmail.length);
          
          // Asociar estos bookings al user_id
          const bookingIds = bookingsByEmail.map(b => b.id);
          await supabase
            .from('bookings')
            .update({ user_id: userId })
            .in('id', bookingIds);
          
          bookings = [...bookings, ...bookingsByEmail];
        }
      }

      console.log("[UserScreen] Total bookings encontrados:", bookings.length);

      if (bookings.length > 0) {
        console.log("[UserScreen] Bookings obtenidos:", bookings);
        
        // Mapear bookings a formato de facturas
        const invoices = bookings.map(booking => {
          const issueDate = booking.created_at ? new Date(booking.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const dueDate = booking.due_date 
            ? new Date(booking.due_date).toISOString().split('T')[0]
            : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +15 días por defecto
          
          // Determinar estado correcto
          let status = 'unpaid'; // Por defecto
          if (booking.payment_status === 'APPROVED') {
            status = 'paid';
          } else if (dueDate < new Date().toISOString().split('T')[0]) {
            status = 'overdue'; // Vencida
          }
          
          // ✅ Convertir amount_total a número y validar
          const amountTotal = Number(booking.amount_total) || 0;
          const amountMonthly = Number(booking.amount_monthly) || 0;
          
          console.log(`[UserScreen] Booking ${booking.id}:`, {
            amount_total: booking.amount_total,
            amount_monthly: booking.amount_monthly,
            amountTotal,
            amountMonthly
          });
          
          return {
            id: booking.id,
            company_id: userId,
            invoice_number: booking.invoice_number || `INV-${booking.id.substring(0, 8)}`,
            issue_date: issueDate,
            due_date: dueDate,
            amount: amountTotal,
            amount_monthly: amountMonthly,
            status: status,
            reference: booking.wompi_reference || `QUARTO_${booking.id}`,
            description: `Servicio de almacenamiento${booking.logistics_method ? ` - ${booking.logistics_method}` : ''}`,
            payment_status: booking.payment_status,
            transport_price: Number(booking.transport_price) || 0,
          };
        });
        
        console.log("[UserScreen] Facturas mapeadas:", invoices);
        setUserInvoices(invoices);
      } else {
        console.log("[UserScreen] No se encontraron bookings");
        setUserInvoices([]);
      }

      // Cargar inventario - buscar por booking_id de los bookings del usuario
      let inventory = [];
      
      if (bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id);
        
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false });

        if (!inventoryError && inventoryData) {
          console.log("[UserScreen] Inventario encontrado:", inventoryData.length, "items");
          inventory = inventoryData;
        } else if (inventoryError) {
          console.error("[UserScreen] Error cargando inventario:", inventoryError);
        }
      }

      console.log("[UserScreen] Total inventario encontrado:", inventory.length);
      
      if (inventory.length > 0) {
        setUserInventory(inventory);
      } else {
        setUserInventory([]);
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