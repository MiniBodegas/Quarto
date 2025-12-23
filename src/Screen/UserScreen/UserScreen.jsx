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
        const authId = session.user.id; // ✅ LA VERDAD ABSOLUTA
        console.log("[UserScreen] Usuario autenticado:", userEmail, "ID:", authId);

        // 2. Obtener datos del usuario desde la tabla users
        // ✅ BUSCAR PRIMERO POR EMAIL (para usuarios legacy)
        let userData = null;
        const { data: existingUserByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (emailError) {
          console.error("[UserScreen] Error consultando usuario por email:", emailError);
          addNotification('error', 'Error al consultar los datos del usuario');
          navigate('/login');
          return;
        }

        if (existingUserByEmail) {
          // Usuario existe por email
          if (existingUserByEmail.id !== authId) {
            // ⚠️ ID no coincide - actualizar al auth.uid() correcto
            console.log("[UserScreen] ⚠️ Usuario existe con ID diferente, sincronizando...");
            console.log("[UserScreen] ID anterior:", existingUserByEmail.id);
            console.log("[UserScreen] ID nuevo (auth.uid):", authId);
            
            // Actualizar bookings primero para evitar problemas de FK
            await supabase
              .from('bookings')
              .update({ user_id: authId })
              .eq('user_id', existingUserByEmail.id);
            
            // Actualizar authorized_persons
            await supabase
              .from('authorized_persons')
              .update({ user_id: authId })
              .eq('user_id', existingUserByEmail.id);
            
            // Actualizar el ID del usuario
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({ id: authId })
              .eq('email', userEmail)
              .select()
              .single();
            
            if (updateError) {
              console.error("[UserScreen] Error actualizando ID de usuario:", updateError);
              // Si falla, usar el usuario existente
              userData = existingUserByEmail;
            } else {
              userData = updatedUser;
              console.log("[UserScreen] ✅ Usuario sincronizado correctamente");
            }
          } else {
            // ID ya coincide
            userData = existingUserByEmail;
            console.log("[UserScreen] ✅ Usuario encontrado con ID correcto");
          }
        } else {
          // Usuario no existe, crearlo
          console.log("[UserScreen] Usuario no existe en tabla users, creando...");
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              id: authId,
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

  // ✅ Recargar datos cuando se vuelva de agregar items
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && loginUser?.id) {
        console.log('[UserScreen] 🔄 Página visible, verificando si hay que recargar...');
        const wasAdding = localStorage.getItem('quarto_adding_items');
        if (wasAdding === 'completed') {
          console.log('[UserScreen] 🔄 Recargando datos después de agregar items...');
          localStorage.removeItem('quarto_adding_items');
          loadUserData(loginUser.id);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // También verificar al montar si acabamos de volver
    if (loginUser?.id) {
      const wasAdding = localStorage.getItem('quarto_adding_items');
      if (wasAdding === 'completed') {
        console.log('[UserScreen] 🔄 Recargando datos al montar (items agregados)');
        localStorage.removeItem('quarto_adding_items');
        loadUserData(loginUser.id);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loginUser]);

  // ============================================
  // CARGAR DATOS DEL USUARIO
  // ============================================
  const loadUserData = async (userId) => {
    try {
      console.log("[UserScreen] 🔍 Cargando datos para userId:", userId);

      // Obtener el email del usuario
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      console.log("[UserScreen] 📧 Email del usuario auth:", userEmail);

      // Cargar bookings (facturas) - buscar por user_id O por email
      let bookings = [];
      
      // 1. Buscar por user_id (bookings ya asociados)
      console.log("[UserScreen] 🔎 Buscando bookings con user_id:", userId);
      const { data: bookingsByUserId, error: bookingsError1 } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!bookingsError1 && bookingsByUserId) {
        console.log("[UserScreen] ✅ Bookings encontrados por user_id:", bookingsByUserId.length);
        console.log("[UserScreen] 📋 Bookings por user_id:", bookingsByUserId.map(b => ({
          id: b.id.substring(0, 8),
          email: b.email,
          user_id: b.user_id,
          status: b.payment_status
        })));
        bookings = [...bookingsByUserId];
      }

      // 2. Buscar por email (bookings del mismo usuario con user_id diferente)
      if (userEmail) {
        console.log("[UserScreen] 🔎 Buscando bookings por email:", userEmail);
        const { data: bookingsByEmail, error: bookingsError2 } = await supabase
          .from('bookings')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false });

        if (!bookingsError2 && bookingsByEmail && bookingsByEmail.length > 0) {
          console.log("[UserScreen] 📧 Bookings encontrados por email:", bookingsByEmail.length);
          console.log("[UserScreen] 📋 Bookings por email:", bookingsByEmail.map(b => ({
            id: b.id.substring(0, 8),
            email: b.email,
            user_id: b.user_id,
            status: b.payment_status
          })));
          
          // Asociar bookings que tengan user_id diferente al actual
          const bookingsToUpdate = bookingsByEmail.filter(b => b.user_id !== userId);
          
          if (bookingsToUpdate.length > 0) {
            const bookingIds = bookingsToUpdate.map(b => b.id);
            console.log("[UserScreen] 🔗 Asociando", bookingsToUpdate.length, "bookings al user_id:", userId);
            
            await supabase
              .from('bookings')
              .update({ user_id: userId })
              .in('id', bookingIds);
          }
          
          // Combinar todos los bookings (evitar duplicados por ID)
          const existingIds = new Set(bookings.map(b => b.id));
          const newBookings = bookingsByEmail.filter(b => !existingIds.has(b.id));
          bookings = [...bookings, ...newBookings];
        } else {
          console.log("[UserScreen] ℹ️ No hay bookings con email:", userEmail);
        }
      }

      console.log("[UserScreen] 📊 Total bookings encontrados:", bookings.length);

      // ✅ 1. Cargar pagos reales de la tabla payments (facturas/cobros pendientes)
      let realInvoices = [];
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', bookings.map(b => b.id))
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('[UserScreen] ❌ Error cargando pagos:', paymentsError);
      } else if (paymentsData && paymentsData.length > 0) {
        console.log('[UserScreen] ✅ Pagos encontrados:', paymentsData.length);
        console.log('[UserScreen] � Datos de pagos:', paymentsData);
        
        realInvoices = paymentsData.map(payment => {
          const issueDate = payment.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          // Vencimiento 15 días después de creación
          const dueDate = payment.created_at 
            ? new Date(new Date(payment.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          // Mapear status del pago
          let status = 'unpaid';
          if (payment.status === 'APPROVED' || payment.status === 'PAID') {
            status = 'paid';
          } else if (payment.status === 'PENDING' && dueDate < new Date().toISOString().split('T')[0]) {
            status = 'overdue';
          }
          
          const amount = payment.amount_in_cents ? payment.amount_in_cents / 100 : 0;
          
          return {
            id: payment.id,
            company_id: userId,
            invoice_number: payment.wompi_reference || `PAY-${payment.id.substring(0, 8)}`,
            issue_date: issueDate,
            due_date: dueDate,
            amount: amount,
            amount_monthly: amount,
            status: status,
            reference: payment.wompi_reference || `QUARTO_${payment.id}`,
            description: payment.wompi_event?.description || 'Servicio de almacenamiento',
            payment_status: payment.status,
            booking_id: payment.booking_id,
            wompi_transaction_id: payment.wompi_transaction_id,
            isRealPayment: true, // ✅ Marcar como pago real
          };
        });
      } else {
        console.log('[UserScreen] ℹ️ No hay pagos registrados');
      }

      // ✅ 2. Crear facturas desde bookings (para compatibilidad, solo si NO tienen pago)
      const bookingsWithPayment = new Set(realInvoices.map(inv => inv.booking_id));
      let bookingInvoices = [];
      if (bookings.length > 0) {
        console.log("[UserScreen] Bookings obtenidos:", bookings);
        
        // Mapear bookings a formato de facturas (solo los que NO tienen pago asociado)
        bookingInvoices = bookings
          .filter(booking => !bookingsWithPayment.has(booking.id)) // ✅ Excluir los que ya tienen pago
          .map(booking => {
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
            invoice_number: booking.invoice_number || `INV-BOOK-${booking.id.substring(0, 8)}`,
            issue_date: issueDate,
            due_date: dueDate,
            amount: amountMonthly, // ✅ Usar amount_monthly (precio recurrente mensual)
            amount_monthly: amountMonthly,
            amount_total: amountTotal, // ✅ Guardar amount_total solo como referencia del primer pago
            status: status,
            reference: booking.wompi_reference || `QUARTO_${booking.id}`,
            description: `Servicio de almacenamiento${booking.logistics_method ? ` - ${booking.logistics_method}` : ''}`,
            payment_status: booking.payment_status,
            transport_price: Number(booking.transport_price) || 0,
            booking_id: booking.id,
          };
        });
        
        console.log("[UserScreen] Facturas desde bookings:", bookingInvoices.length);
      }

      // ✅ 3. Combinar facturas reales + facturas de bookings (evitar duplicados por booking_id)
      const allInvoices = [...realInvoices];
      
      // Agregar facturas de bookings solo si no hay factura real para ese booking
      bookingInvoices.forEach(bookingInv => {
        const hasRealInvoice = realInvoices.some(inv => inv.booking_id === bookingInv.booking_id);
        if (!hasRealInvoice) {
          allInvoices.push(bookingInv);
        }
      });

      console.log("[UserScreen] 📊 Total facturas combinadas:", allInvoices.length);
      console.log("[UserScreen] Facturas finales:", allInvoices);
      setUserInvoices(allInvoices);

      if (allInvoices.length === 0) {
        console.log("[UserScreen] No se encontraron facturas");
      }

      // Cargar inventario - buscar por booking_id de los bookings del usuario
      let inventory = [];
      
      if (bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id);
        console.log("[UserScreen] 🔍 Buscando inventario para bookings:", bookingIds);
        
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false });

        if (!inventoryError && inventoryData) {
          console.log("[UserScreen] ✅ Inventario encontrado:", inventoryData.length, "items");
          console.log("[UserScreen] 📦 Datos del inventario:", inventoryData);
          console.log("[UserScreen] 📦 Cantidades por item:", inventoryData.map(i => ({
            name: i.name,
            quantity: i.quantity,
            volume: i.volume,
            booking_id: i.booking_id
          })));
          inventory = inventoryData;
        } else if (inventoryError) {
          console.error("[UserScreen] ❌ Error cargando inventario:", inventoryError);
        } else {
          console.log("[UserScreen] ℹ️ No se encontró inventario para estos bookings");
        }
      } else {
        console.log("[UserScreen] ⚠️ No hay bookings, no se puede cargar inventario");
      }

      console.log("[UserScreen] 📊 Total inventario encontrado:", inventory.length);
      
      // NO establecer inventario aquí todavía, esperar a mapear storage_unit_id
      
      // ✅ Crear UNA SOLA unidad de almacenamiento para todos los items del usuario
      const totalVolume = bookings.reduce((sum, b) => sum + (b.total_volume || 0), 0);
      const storageUnits = [{
        id: 'main-storage', // ID único para la bodega principal
        number: '1',
        name: 'Mi Bodega',
        booking_id: null, // No está asociada a un booking específico
        location: 'Ubicación principal',
        size: totalVolume,
      }];

      console.log("[UserScreen] 📦 Unidad de almacenamiento creada (única):", storageUnits.length);
      setUserStorageUnits(storageUnits);

      // ✅ Asociar TODOS los items a la misma unidad de almacenamiento
      if (inventory.length > 0) {
        const inventoryWithUnits = inventory.map(item => ({
          ...item,
          storage_unit_id: 'main-storage', // Todos van a la misma bodega
        }));
        
        console.log("[UserScreen] 📦 Inventario asociado a bodega única:", inventoryWithUnits.length, "items");
        setUserInventory(inventoryWithUnits);
      } else {
        console.log("[UserScreen] ⚠️ No hay inventario para mostrar");
        setUserInventory([]);
      }

      // Cargar personas autorizadas del usuario
      // ✅ USAR AUTH.UID() PARA CARGAR TAMBIÉN
      const { data: { session } } = await supabase.auth.getSession();
      const authId = session?.user?.id;
      
      console.log("[UserScreen] 👥 Cargando personas autorizadas para auth.uid:", authId);
      
      const { data: authorizedData, error: authorizedError } = await supabase
        .from('authorized_persons')
        .select('*')
        .eq('user_id', authId) // ✅ Usar auth.uid()
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!authorizedError && authorizedData) {
        console.log("[UserScreen] ✅ Personas autorizadas encontradas:", authorizedData.length);
        setAuthorizedPersons(authorizedData);
      } else if (authorizedError) {
        console.error("[UserScreen] ❌ Error cargando personas autorizadas:", authorizedError);
        setAuthorizedPersons([]);
      } else {
        console.log("[UserScreen] ℹ️ No hay personas autorizadas registradas");
        setAuthorizedPersons([]);
      }

      // TODO: Cargar logs de inventario cuando se implemente la tabla
      setUserInventoryLogs([]);

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
    try {
      // Validar datos
      if (!name || !documentId) {
        addNotification('error', 'Por favor completa todos los campos');
        return;
      }

      // ✅ OBTENER AUTH.UID() - LA VERDAD ABSOLUTA
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addNotification('error', 'No hay sesión activa');
        navigate('/login');
        return;
      }

      const authId = session.user.id;

      // 🔍 DEBUG: Solo 2 logs
      console.log("auth.uid:", authId);
      console.log("users.id (profile):", loggedInCompanyProfile?.id);

      console.log("[UserScreen] Agregando persona autorizada para auth.uid:", authId);

      // ✅ INSERTAR CON AUTH.UID()
      const { data: newPerson, error: insertError } = await supabase
        .from('authorized_persons')
        .insert([{
          user_id: authId, // ✅ auth.uid() directo
          name: name.trim(),
          document_type: 'CC',
          document_number: documentId.trim(),
          can_pickup: true,
          can_deliver: true,
          is_active: true,
        }])
        .select()
        .single();

      if (insertError) {
        console.error("[UserScreen] Error insertando persona autorizada:", insertError);
        addNotification('error', 'Error al agregar la persona autorizada');
        return;
      }

      console.log("[UserScreen] ✅ Persona autorizada agregada:", newPerson);

      // Actualizar estado local
      setAuthorizedPersons(prev => [newPerson, ...prev]);
      addNotification('success', `${name} agregado como persona autorizada`);
    } catch (error) {
      console.error("[UserScreen] Error en handleAddPerson:", error);
      addNotification('error', 'Error al agregar la persona autorizada');
    }
  }, [loggedInCompanyProfile, addNotification, navigate]);

  const handleRemovePerson = useCallback(async (personId) => {
    try {
      if (!personId) {
        addNotification('error', 'ID de persona inválido');
        return;
      }

      console.log("[UserScreen] Removiendo persona autorizada:", personId);

      // Marcar como inactiva en lugar de eliminar (soft delete)
      const { error: updateError } = await supabase
        .from('authorized_persons')
        .update({ is_active: false })
        .eq('id', personId);

      if (updateError) {
        console.error("[UserScreen] Error removiendo persona autorizada:", updateError);
        addNotification('error', 'Error al remover la persona autorizada');
        return;
      }

      console.log("[UserScreen] ✅ Persona autorizada removida");

      // Actualizar estado local
      setAuthorizedPersons(prev => prev.filter(p => p.id !== personId));
      addNotification('success', 'Persona autorizada removida correctamente');
    } catch (error) {
      console.error("[UserScreen] Error en handleRemovePerson:", error);
      addNotification('error', 'Error al remover la persona autorizada');
    }
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
      // onInventoryMovement NO se pasa para usuarios (modo solo lectura)
      isRecentLogin={isRecentLogin}
      addNotification={addNotification}
    />
  );
};

export default UserScreen;