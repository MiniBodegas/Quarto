import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
} from "@react-email/components";

export default function QuoteTemplate({
  name,
  date,
  logisticsMethod,
  totalVolume,
  transportPrice,
  totalPrice,
  storagePrice,
  items,
  contactName,
  contactRole,
  contactEmail,
  website,
  logoUrl,
  signatureUrl,
}) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0f172a", padding: "24px 0", fontFamily: "Arial, sans-serif", color: "#e2e8f0" }}>
        <Container style={{
          backgroundColor: "#111827",
          maxWidth: "700px",
          margin: "0 auto",
          borderRadius: "20px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
          overflow: "hidden",
        }}>
          <Section style={{ display: "flex", flexDirection: "row" }}>
            {/* Izquierda */}
            <Column style={{ backgroundColor: "#1f2937", width: "220px", padding: "24px 18px" }}>
              {logoUrl && <img src={logoUrl} alt="Quarto Logo" style={{ height: "40px", marginBottom: "16px" }} />}
              {website && (
                <a href={`https://${website}`} style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "24px",
                  padding: "8px 16px",
                  textDecoration: "none",
                  fontSize: "14px",
                  display: "inline-block",
                  marginBottom: "16px"
                }}>{website}</a>
              )}
              {signatureUrl && <img src={signatureUrl} alt="Firma" style={{ height: "40px", borderRadius: "8px", marginBottom: "12px" }} />}
              <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: "15px" }}>{contactName}</div>
              <div style={{ color: "#bfdbfe", fontSize: "13px", marginBottom: "8px" }}>{contactRole}</div>
              <div style={{ color: "#bfdbfe", fontSize: "13px" }}>✉️ {contactEmail}</div>
            </Column>

            {/* Derecha */}
            <Column style={{ padding: "24px" }}>
              <Heading style={{ fontSize: "22px", marginBottom: "16px", color: "#93c5fd", fontWeight: 700 }}>
                Cotización para {name}
              </Heading>

              {/* Detalles */}
              <Section style={{ marginBottom: "16px" }}>
                <Row>
                  <Column style={{ paddingRight: "16px", borderRight: "1px solid #1f2937" }}>
                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Fecha</Text>
                    <Text style={{ fontSize: "14px", marginBottom: "10px" }}>{date}</Text>

                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Método logístico</Text>
                    <Text style={{ fontSize: "14px", marginBottom: "10px" }}>{logisticsMethod}</Text>

                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Volumen total</Text>
                    <Text style={{ fontSize: "14px" }}>{totalVolume} m³</Text>
                  </Column>

                  <Column style={{ paddingLeft: "16px" }}>
                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Precio logístico</Text>
                    <Text style={{ fontSize: "14px", marginBottom: "10px" }}>${(transportPrice ?? 0).toLocaleString()}</Text>

                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Precio almacenamiento (mensual)</Text>
                    <Text style={{ fontSize: "16px", color: "#93c5fd", fontWeight: 700, marginBottom: "8px" }}>
                      ${Number(storagePrice ?? totalPrice ?? 0).toLocaleString()}
                    </Text>

                    <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: "13px" }}>Total cotización</Text>
                    <Text style={{ fontSize: "18px", color: "#60a5fa", fontWeight: 700 }}>
                      ${Number((storagePrice ?? 0) + (transportPrice ?? 0)).toLocaleString()}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Tabla de artículos */}
              <Section>
                <Text style={{ fontWeight: 700, color: "#93c5fd", fontSize: 14, marginBottom: 8 }}>
                  Artículos cotizados:
                </Text>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
                  <thead>
                    <tr style={{ background: "#1f2937" }}>
                      <th style={{ textAlign: "left", padding: "8px", color: "#93c5fd", fontWeight: 700 }}>Artículo</th>
                      <th style={{ textAlign: "center", padding: "8px", color: "#93c5fd", fontWeight: 700 }}>Cantidad</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "#93c5fd", fontWeight: 700 }}>Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasItems ? (
                      items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #1f2937" }}>
                          <td style={{ padding: "8px", color: "#e5e7eb" }}>{item.name}</td>
                          <td style={{ textAlign: "center", padding: "8px", color: "#e5e7eb" }}>{item.quantity}</td>
                          <td style={{ textAlign: "right", padding: "8px", color: "#e5e7eb" }}>
                            {Number(item.volume ?? 0).toFixed(2)} m³
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ padding: "8px", color: "#9ca3af" }}>
                          No se registraron artículos en esta cotización.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Section>

              <Text style={{ marginTop: "12px", fontSize: "14px", color: "#e5e7eb" }}>
                Si tienes dudas o quieres modificar tu cotización, contáctanos.<br />
                <span style={{ color: "#60a5fa", fontWeight: "bold" }}>— Equipo Quarto</span>
              </Text>
            </Column>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
