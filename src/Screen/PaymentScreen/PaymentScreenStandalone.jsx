import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WompiPayButton, Button } from "../../Components";
import { supabase } from "../../supabase";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Pantalla de pago independiente
 * Se accede desde el portal de usuario cuando quiere pagar una factura pendiente
 */
const PaymentScreenStandalone = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wompiData, setWompiData] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loadingSig, setLoadingSig] = useState(false);
  const [sigError, setSigError] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar datos del pago
  useEffect(() => {
    const loadPaymentData = () => {
      try {
        setLoading(true);

        // Intentar obtener datos desde localStorage o URL params
        const savedPayment = localStorage.getItem('quarto_pending_payment');
        const bookingId = searchParams.get('booking_id');

        if (savedPayment) {
          const data = JSON.parse(savedPayment);
          setWompiData(data);
          console.log('[PaymentStandalone] Datos cargados desde localStorage:', data);
        } else if (bookingId) {
          // Si viene un booking_id, cargar datos desde Supabase
          loadBookingData(bookingId);
        } else {
          setSigError('No se encontraron datos de pago. Por favor intenta desde tu perfil.');
        }
      } catch (error) {
        console.error('[PaymentStandalone] Error cargando datos:', error);
        setSigError('Error al cargar datos del pago.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [searchParams]);

  const loadBookingData = async (bookingId) => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        console.error('[PaymentStandalone] Error obteniendo booking:', error);
        setSigError('No se pudo cargar la información del pago.');
        return;
      }

      let wompiReference = booking.wompi_reference;
      
      // Si no existe wompi_reference, generar uno nuevo y guardarlo en BD
      if (!wompiReference) {
        wompiReference = `QUARTO_${bookingId}_${Date.now()}`;
        console.log('[PaymentStandalone] 📝 Generando nuevo wompi_reference:', wompiReference);
        
        // Guardar en BD antes de usarlo (crítico para que el webhook lo encuentre)
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ wompi_reference: wompiReference })
          .eq('id', bookingId);
        
        if (updateError) {
          console.error('[PaymentStandalone] ⚠️ Error guardando wompi_reference:', updateError);
          setSigError('No se pudo generar la referencia de pago.');
          return;
        }
        console.log('[PaymentStandalone] ✅ wompi_reference guardado en BD');
      }

      const wompiPayload = {
        reference: wompiReference,
        amountInCents: Math.round((booking.amount_total || 0) * 100),
        currency: 'COP',
        bookingId: booking.id,
        meta: {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
        }
      };

      setWompiData(wompiPayload);
      console.log('[PaymentStandalone] Datos del booking cargados:', wompiPayload);
    } catch (error) {
      console.error('[PaymentStandalone] Error:', error);
      setSigError('Error inesperado al cargar el pago.');
    }
  };

  // Generar firma de integridad
  useEffect(() => {
    const generateSignature = async () => {
      if (!wompiData) return;

      setLoadingSig(true);
      setSigError("");
      setSignature(null);

      try {
        console.log('[PaymentStandalone] Generando firma...');

        const res = await fetch(`${API_URL}/api/wompi/integrity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: wompiData.reference,
            amountInCents: wompiData.amountInCents,
            currency: wompiData.currency || "COP",
            publicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('[PaymentStandalone] Error generando firma:', data);
          setSigError(data?.error || "No se pudo generar la firma.");
          return;
        }

        if (!data?.signatureIntegrity) {
          setSigError("Respuesta inválida del servidor.");
          return;
        }

        setSignature(data.signatureIntegrity);
        console.log('[PaymentStandalone] ✅ Firma generada');
      } catch (err) {
        console.error('[PaymentStandalone] Error:', err);
        setSigError("Error de red generando la firma.");
      } finally {
        setLoadingSig(false);
      }
    };

    generateSignature();
  }, [wompiData]);

  // Verificación automática del pago
  useEffect(() => {
    if (!wompiData?.bookingId) return;

    let verificationCount = 0;

    const checkPaymentStatus = async () => {
      try {
        verificationCount++;
        console.log(`[PaymentStandalone] 🔍 Verificación #${verificationCount}`);

        const { data: booking, error } = await supabase
          .from("bookings")
          .select("id, payment_status, wompi_transaction_id, wompi_reference, paid_at")
          .eq("id", wompiData.bookingId)
          .single();

        if (error) {
          console.error("[PaymentStandalone] Error verificando:", error);
          return;
        }

        console.log("[PaymentStandalone] Estado:", booking.payment_status);

        if (booking.payment_status === "APPROVED") {
          console.log("[PaymentStandalone] ✅ Pago aprobado!");
          clearInterval(intervalId);
          
          // Limpiar localStorage
          localStorage.removeItem('quarto_pending_payment');
          
          // Redirigir al portal con mensaje de éxito
          setTimeout(() => {
            navigate('/user', { 
              state: { 
                message: '¡Pago exitoso! Tu factura ha sido pagada.',
                paymentSuccess: true 
              } 
            });
          }, 1500);
        }
      } catch (err) {
        console.error("[PaymentStandalone] Error en verificación:", err);
      }
    };

    const timeoutId = setTimeout(checkPaymentStatus, 10000);
    const intervalId = setInterval(checkPaymentStatus, 10000);
    const maxChecksTimeout = setTimeout(() => {
      console.log("[PaymentStandalone] ⏱️ Tiempo máximo alcanzado");
      clearInterval(intervalId);
    }, 600000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      clearTimeout(maxChecksTimeout);
    };
  }, [wompiData?.bookingId, navigate]);

  const handleBack = () => {
    localStorage.removeItem('quarto_pending_payment');
    navigate('/user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando datos del pago...</p>
        </div>
      </div>
    );
  }

  if (!wompiData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <span className="material-symbols-outlined text-4xl text-red-600 mb-2">error</span>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{sigError || 'No se encontraron datos de pago'}</p>
          </div>
          <Button onClick={handleBack}>Volver al Portal</Button>
        </div>
      </div>
    );
  }

  const totalCOP = wompiData.amountInCents / 100;

  return (
    <div className="w-full min-h-screen bg-background px-4 sm:px-6 py-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
        
        {/* Header */}
        <h1 className="text-2xl font-bold text-[#012E58] mb-1">
          Realizar pago
        </h1>
        <p className="text-slate-600 mb-4 text-sm">
          Completa tu pago de forma segura con Wompi
        </p>

        {/* Resumen */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600 text-sm">Servicio</span>
            <span className="font-medium text-sm">Almacenamiento Quarto</span>
          </div>

          {wompiData.meta?.invoiceNumber && (
            <div className="flex justify-between mb-2">
              <span className="text-slate-600 text-sm">Factura</span>
              <span className="font-medium text-sm">{wompiData.meta.invoiceNumber}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-600 text-sm">Total a pagar</span>
            <span className="font-bold text-lg text-[#012E58]">
              ${totalCOP.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        {/* Estados */}
        {loadingSig && (
          <p className="text-slate-600 mb-4 text-sm text-center">
            🔐 Preparando pago seguro…
          </p>
        )}

        {!!sigError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-4 text-sm">
            {sigError}
          </div>
        )}

        {/* Botón Wompi */}
        {!loadingSig && signature && (
          <div className="mb-4">
            <WompiPayButton
              publicKey={import.meta.env.VITE_WOMPI_PUBLIC_KEY}
              reference={wompiData.reference}
              amountInCents={wompiData.amountInCents}
              currency="COP"
              signatureIntegrity={signature}
            />
          </div>
        )}

        {/* Seguridad */}
        <p className="text-xs text-slate-500 text-center mb-4">
          🔒 Pago procesado de forma segura por Wompi.  
          No compartimos tu información financiera.
        </p>

        {/* Back */}
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleBack}>
            Volver al Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreenStandalone;
