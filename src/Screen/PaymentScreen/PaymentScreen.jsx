// Payment Screen con Verificación Automática

import { useEffect, useState } from "react";
import { WompiPayButton, Button, Spinner } from "../../Components";
import { supabase } from "../../supabase";

const API_URL = import.meta.env.VITE_API_URL;

const PaymentScreen = ({ wompi, onBack, onPaymentSuccess }) => {
  const [signature, setSignature] = useState(null);
  const [loadingSig, setLoadingSig] = useState(false);
  const [sigError, setSigError] = useState("");
  
  // ✅ Estado de verificación automática
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentChecks, setPaymentChecks] = useState(0);

  // Efecto para generar firma
  useEffect(() => {
    const run = async () => {
      if (!wompi) return;

      setLoadingSig(true);
      setSigError("");
      setSignature(null);

      try {
        console.group("[Payment] Generando firma (server)");
        console.log("reference:", wompi.reference);
        console.log("amountInCents:", wompi.amountInCents);
        console.log("currency:", wompi.currency || "COP");
        console.log("publicKey:", import.meta.env.VITE_WOMPI_PUBLIC_KEY);
        console.groupEnd();

        const res = await fetch(`${API_URL}/api/wompi/integrity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: wompi.reference,
            amountInCents: wompi.amountInCents,
            currency: wompi.currency || "COP",
            publicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("[Payment] Error signature:", data);
          setSigError(data?.error || "No se pudo generar la firma.");
          return;
        }

        if (!data?.signatureIntegrity) {
          setSigError("Respuesta inválida del servidor (falta signatureIntegrity).");
          return;
        }

        setSignature(data.signatureIntegrity);
      } catch (err) {
        console.error("[Payment] Error inesperado:", err);
        setSigError("Error de red generando la firma.");
      } finally {
        setLoadingSig(false);
      }
    };

    run();
  }, [wompi]);

  // ✅ Efecto para verificar el pago automáticamente cada 5 segundos
  useEffect(() => {
    if (!wompi?.bookingId) return;

    const checkPaymentStatus = async () => {
      try {
        setCheckingPayment(true);
        console.log(`[Payment] 🔍 Verificación automática #${paymentChecks + 1}`);

        // ✅ Traer toda la info del booking incluyendo wompi_transaction_id
        const { data: booking, error } = await supabase
          .from("bookings")
          .select("id, payment_status, wompi_transaction_id, wompi_reference, name, email, phone, paid_at")
          .eq("id", wompi.bookingId)
          .single();

        if (error) {
          console.error("[Payment] Error verificando pago:", error);
          return;
        }

        console.log("[Payment] Estado actual:", booking.payment_status);
        if (booking.wompi_transaction_id) {
          console.log("[Payment] 🎫 Transaction ID:", booking.wompi_transaction_id);
        }

        if (booking.payment_status === "APPROVED") {
          console.log("[Payment] ✅ Pago aprobado! Redirigiendo...");
          console.log("[Payment] 📋 Datos del pago:", {
            transactionId: booking.wompi_transaction_id,
            reference: booking.wompi_reference,
            paidAt: booking.paid_at
          });
          
          // Limpiar interval
          if (intervalId) clearInterval(intervalId);
          
          // Llamar callback de éxito con toda la info
          if (onPaymentSuccess) {
            onPaymentSuccess(booking);
          }
        } else {
          setPaymentChecks(prev => prev + 1);
        }
      } catch (err) {
        console.error("[Payment] Error en verificación automática:", err);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Primera verificación después de 5 segundos
    const timeoutId = setTimeout(() => {
      checkPaymentStatus();
    }, 5000);

    // Verificaciones periódicas cada 5 segundos
    const intervalId = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    // Limpiar al desmontar o después de 5 minutos (60 verificaciones)
    const maxChecksTimeout = setTimeout(() => {
      console.log("[Payment] ⏱️ Tiempo máximo de verificación alcanzado");
      clearInterval(intervalId);
    }, 300000); // 5 minutos

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      clearTimeout(maxChecksTimeout);
    };
  }, [wompi?.bookingId, onPaymentSuccess]);

  if (!wompi) {
    return (
      <div className="p-6">
        <p>No hay información de pago.</p>
        <Button onClick={onBack}>Volver</Button>
      </div>
    );
  }

  const totalCOP = wompi.amountInCents / 100;

  return (
    <div className="w-full px-4 sm:px-6 py-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-[#012E58] mb-1">
          Paso final: realiza tu pago
        </h1>
        <p className="text-slate-600 mb-4 text-sm">
          Tu reserva quedará confirmada automáticamente.
        </p>

        {/* Resumen */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600 text-sm">Servicio</span>
            <span className="font-medium text-sm">Almacenamiento Quarto</span>
          </div>

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
              reference={wompi.reference}
              amountInCents={wompi.amountInCents}
              currency="COP"
              signatureIntegrity={signature}
            />
          </div>
        )}

        {/* ✅ Indicador de verificación automática */}
        <div className="mb-4">
          {checkingPayment && (
            <div className="flex items-center justify-center gap-3 text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Spinner size="sm" />
              <div className="text-sm">
                <p className="font-medium">🔍 Verificando estado del pago...</p>
                <p className="text-xs text-slate-500 mt-1">Verificación #{paymentChecks}</p>
              </div>
            </div>
          )}

          {!checkingPayment && paymentChecks > 0 && (
            <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-700 text-sm font-medium">
                ⏱️ Verificación automática activa
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {paymentChecks} {paymentChecks === 1 ? 'verificación' : 'verificaciones'} • Revisando cada 5 segundos
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Serás redirigido automáticamente cuando se confirme el pago
              </p>
            </div>
          )}

          {paymentChecks === 0 && !checkingPayment && signature && (
            <div className="text-center bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">
                ✨ Verificación automática lista
              </p>
              <p className="text-xs text-green-600 mt-1">
                Comenzaremos a verificar tu pago en 5 segundos
              </p>
            </div>
          )}
        </div>

        {/* Seguridad */}
        <p className="text-xs text-slate-500 text-center mb-4">
          🔒 Pago procesado de forma segura por Wompi.  
          No compartimos tu información financiera.
        </p>

        {/* Back */}
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
