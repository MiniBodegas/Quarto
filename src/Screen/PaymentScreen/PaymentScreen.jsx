// Payment Screennnnnn Perfecto



import { useEffect, useState } from "react";
import { WompiPayButton, Button } from "../../Components";

const PaymentScreen = ({ wompi, onBack }) => {
  const [signature, setSignature] = useState(null);
  const [loadingSig, setLoadingSig] = useState(false);
  const [sigError, setSigError] = useState("");

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

        const res = await fetch("http://localhost:3000/api/wompi/integrity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: wompi.reference,
            amountInCents: wompi.amountInCents,
            currency: wompi.currency || "COP",
            publicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY, // ✅ CLAVE
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
    <div className="w-full px-4 sm:px-6 lg:px-8 flex-grow">
      <h1 className="text-2xl font-bold text-[#012E58] mb-4">
        Pagar servicio
      </h1>

      <p className="mb-6 text-slate-600">
        Total a pagar:{" "}
        <strong>${totalCOP.toLocaleString("es-CO")}</strong>
      </p>

      {loadingSig && (
        <p className="text-slate-600">Preparando pago seguro...</p>
      )}

      {!!sigError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 mb-4">
          {sigError}
        </div>
      )}

        {!loadingSig && signature && (
        <WompiPayButton
            publicKey={import.meta.env.VITE_WOMPI_PUBLIC_KEY}
            reference={wompi.reference}
            amountInCents={wompi.amountInCents}
            currency="COP"
            signatureIntegrity={signature}
            />
        )}

      <div className="mt-6">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
};

export default PaymentScreen;
