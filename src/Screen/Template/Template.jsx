import React from "react";

const POPPINS_FONT = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap";
const SIGNATURE_IMG = "https://ruta-a-tu-imagen-de-firma.com/firma.png";
const LOGO_IMG = "https://ruta-a-tu-logo.com/logo.png";

function QuoteTemplatePreview() {
  // Información de prueba
  const name = "Juan Esteban Ramirez";
  const date = "2025-12-03";
  const logisticsMethod = "En bodega";
  const totalVolume = 0.65;
  const transportPrice = 8000;
  const totalPrice = 42000;
  const items = [
    { id: 1, name: "Caja Grande", quantity: 3, price: 12000 },
    { id: 2, name: "Silla Oficina", quantity: 2, price: 18000 },
    { id: 3, name: "Mesa Plegable", quantity: 1, price: 12000 }
  ];
  const contactName = "NOMBRE APELLIDO APELLIDO";
  const contactRole = "Cargo de la persona";
  const contactEmail = "hola@sitioincreible.com";
  const website = "www.paginaweb.com";
  const logo = LOGO_IMG;

  // Calcular subtotal de artículos
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div style={{
      backgroundColor: "#f7f9fc",
      padding: "40px 0",
      minHeight: "100vh",
      fontFamily: "'Poppins', Arial, Helvetica, sans-serif"
    }}>
      <link href={POPPINS_FONT} rel="stylesheet" />
      <div style={{
        backgroundColor: "#fff",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0",
        borderRadius: "20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "row",
        gap: "0"
      }}>
        {/* Sección izquierda: Logo y contacto */}
        <div style={{
          background: "#eaf2ff",
          borderRadius: "20px 0 0 20px",
          width: "320px",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <img src={logo} alt="Quarto Logo" style={{ height: "56px", marginBottom: "32px" }} />
          <a href={`https://${website}`} target="_blank" rel="noopener noreferrer"
            style={{
              background: "#0057ff",
              color: "#fff",
              fontWeight: "700",
              borderRadius: "24px",
              padding: "10px 28px",
              textDecoration: "none",
              fontSize: "16px",
              marginBottom: "32px",
              fontFamily: "'Poppins', Arial, Helvetica, sans-serif"
            }}>
            {website}
          </a>
          <div style={{ marginTop: "auto", width: "100%" }}>
            <img src={SIGNATURE_IMG} alt="Firma Quarto" style={{ height: "64px", borderRadius: "8px", marginBottom: "16px" }} />
            <div style={{ color: "#0057ff", fontWeight: "700", fontSize: "18px", fontFamily: "'Poppins', Arial, Helvetica, sans-serif" }}>
              {contactName}
            </div>
            <div style={{ color: "#0057ff", fontSize: "15px", marginBottom: "8px", fontFamily: "'Poppins', Arial, Helvetica, sans-serif" }}>
              {contactRole}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#0057ff", fontSize: "15px" }}>
              <span>✉️ {contactEmail}</span>
            </div>
          </div>
        </div>
        {/* Sección derecha: Cotización y detalles */}
        <div style={{
          flex: 1,
          padding: "40px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <h2 style={{
            fontSize: "28px",
            marginBottom: "16px",
            color: "#0057ff",
            fontWeight: "700",
            fontFamily: "'Poppins', Arial, Helvetica, sans-serif"
          }}>
            Cotización para {name}
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "0",
            marginBottom: "32px",
            justifyContent: "flex-start",
            alignItems: "flex-start"
          }}>
            {/* Detalles de la cotización */}
            <div style={{
              flex: 1,
              paddingRight: "32px",
              borderRight: "1.5px solid #eaf2ff"
            }}>
              <div style={{ fontSize: "16px", color: "#222", fontFamily: "'Poppins', Arial, Helvetica, sans-serif" }}>
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: "700", color: "#0057ff", fontSize: "15px", marginBottom: "4px" }}>Fecha</div>
                  <div>{date}</div>
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: "700", color: "#0057ff", fontSize: "15px", marginBottom: "4px" }}>Método logístico</div>
                  <div>{logisticsMethod}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "#0057ff", fontSize: "15px", marginBottom: "4px" }}>Volumen total</div>
                  <div>{totalVolume} m³</div>
                </div>
              </div>
            </div>
            {/* Precios */}
            <div style={{
              flex: 1,
              paddingLeft: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start"
            }}>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontWeight: "700", color: "#0057ff", fontSize: "15px", marginBottom: "4px" }}>Precio logístico</div>
                <div style={{ fontSize: "16px", color: "#222" }}>${transportPrice.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontWeight: "700", color: "#0057ff", fontSize: "15px", marginBottom: "4px" }}>Total cotización</div>
                <div style={{
                  fontSize: "22px",
                  color: "#0057ff",
                  fontWeight: "700",
                  fontFamily: "'Poppins', Arial, Helvetica, sans-serif"
                }}>
                  ${totalPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: "700", color: "#0057ff", fontSize: "17px", marginBottom: "10px" }}>
              Artículos cotizados:
            </p>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "12px",
              fontFamily: "'Poppins', Arial, Helvetica, sans-serif"
            }}>
              <thead>
                <tr style={{ background: "#eaf2ff" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "#0057ff", fontWeight: "700" }}>Artículo</th>
                  <th style={{ textAlign: "center", padding: "8px", color: "#0057ff", fontWeight: "700" }}>Cantidad</th>
                  <th style={{ textAlign: "right", padding: "8px", color: "#0057ff", fontWeight: "700" }}>Precio unitario</th>
                  <th style={{ textAlign: "right", padding: "8px", color: "#0057ff", fontWeight: "700" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{item.name}</td>
                    <td style={{ textAlign: "center", padding: "8px" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>${item.price.toLocaleString()}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
                {/* Fila de subtotal */}
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", padding: "8px", fontWeight: "700" }}>Subtotal artículos:</td>
                  <td style={{ textAlign: "right", padding: "8px", fontWeight: "700" }}>${subtotal.toLocaleString()}</td>
                </tr>
                {/* Fila de precio logístico */}
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", padding: "8px", fontWeight: "700" }}>Precio logístico:</td>
                  <td style={{ textAlign: "right", padding: "8px", fontWeight: "700" }}>${transportPrice.toLocaleString()}</td>
                </tr>
                {/* Fila de total */}
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", padding: "8px", fontWeight: "700", color: "#0057ff" }}>Total cotización:</td>
                  <td style={{ textAlign: "right", padding: "8px", fontWeight: "700", color: "#0057ff", fontSize: "18px" }}>${totalPrice.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "32px", fontSize: "15px", color: "#222" }}>
            Si tienes dudas o quieres modificar tu cotización, contáctanos.<br />
            <span style={{ color: "#0057ff", fontWeight: "bold" }}>— Equipo Quarto</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuoteTemplatePreview;