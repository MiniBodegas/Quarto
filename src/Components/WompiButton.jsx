// WompiButtonnnnnnnnnnnnnnn Perfecto

import { useEffect, useRef } from "react";

const WOMPI_SCRIPT_SRC = "https://checkout.wompi.co/widget.js";

export default function WompiButton({
  publicKey,
  reference,
  amountInCents,
  currency = "COP",
  signatureIntegrity,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpia para evitar duplicados
    containerRef.current.innerHTML = "";

    const form = document.createElement("form");

    const script = document.createElement("script");
    script.src = WOMPI_SCRIPT_SRC;
    script.async = true;

    script.setAttribute("data-render", "button");
    script.setAttribute("data-public-key", publicKey);
    script.setAttribute("data-currency", currency);
    script.setAttribute("data-amount-in-cents", String(amountInCents));
    script.setAttribute("data-reference", reference);
    script.setAttribute("data-signature:integrity", signatureIntegrity);

    form.appendChild(script);
    containerRef.current.appendChild(form);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [publicKey, reference, amountInCents, currency, signatureIntegrity]);

  return <div ref={containerRef} />;
}
