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
}) {
  const hasItems = Array.isArray(items) && items.length > 0;

  const colors = {
    bg: "#ffffff",
    card: "#ffffff",
    text: "#333333",
    muted: "#666666",
    primary: "#0B5FFF",
    border: "#EAEAEA",
    headerBg: "#ffffff",
    tableHeaderBg: "#F3F6FF",
  };

  const containerStyle = {
    backgroundColor: colors.card,
    maxWidth: "680px",
    margin: "0 auto",
    borderRadius: "16px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
  };

  const sectionPadded = { padding: "20px", width: "100%" };

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>
          {`
            :root { color-scheme: light only; }
            [data-ogsc] body, [data-ogsc] .force-white { background:#ffffff !important; color:#333333 !important; }
            @media (prefers-color-scheme: dark) {
              body, .force-white { background:#ffffff !important; color:#333333 !important; }
              .force-white table, .force-white td, .force-white th { background:#ffffff !important; }
            }
          `}
        </style>
      </Head>

      <Body className="force-white" style={{ backgroundColor: colors.bg, padding: "24px 12px", fontFamily: "Arial, sans-serif", color: colors.text }} bgcolor="#ffffff">
        <Container style={containerStyle} bgcolor="#ffffff" className="force-white">
          {/* Cabecera */}
          <Section style={{ ...sectionPadded, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}` }} bgcolor="#ffffff" className="force-white">
            <Row>
              <Column style={{ width: "64px", verticalAlign: "top" }}>
                {logoUrl && <img src={logoUrl} alt="Quarto" style={{ height: "40px", borderRadius: "6px" }} />}
              </Column>
              <Column style={{ verticalAlign: "top" }}>
                <Heading style={{ fontSize: "20px", margin: "0 0 6px 0", color: colors.primary }}>
                  Cotización para {name}
                </Heading>
                <Text style={{ margin: 0, color: colors.muted, fontSize: "13px" }}>Fecha: {date}</Text>
              </Column>
              <Column style={{ textAlign: "right", verticalAlign: "top" }}>
                {website && (
                  <a href={`https://${website}`} style={{
                    background: colors.primary, color: "#fff", fontWeight: 700,
                    borderRadius: "20px", padding: "8px 14px", textDecoration: "none", fontSize: "13px", display: "inline-block"
                  }}>{website}</a>
                )}
              </Column>
            </Row>
          </Section>

          {/* Contacto (sin firma) */}
          <Section style={{ ...sectionPadded, borderBottom: `1px solid ${colors.border}` }} bgcolor="#ffffff" className="force-white">
            <Row>
              <Column>
                <Text style={{ margin: 0, fontWeight: 700, color: colors.primary }}>{contactName}</Text>
                <Text style={{ margin: "4px 0 0 0", color: colors.muted }}>{contactRole}</Text>
                <a href={`mailto:${contactEmail}`} style={{ marginTop: "6px", display: "inline-block", color: colors.primary, textDecoration: "none" }}>
                  {contactEmail}
                </a>
              </Column>
            </Row>
          </Section>

          {/* Resumen */}
          <Section style={sectionPadded} bgcolor="#ffffff" className="force-white">
            <Row>
              <Column style={{ paddingRight: "12px", borderRight: `1px solid ${colors.border}` }}>
                <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "13px", marginBottom: "6px" }}>Método logístico</Text>
                <Text style={{ margin: "0 0 12px 0", fontSize: "14px" }}>{logisticsMethod}</Text>

                <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "13px", marginBottom: "6px" }}>Volumen total</Text>
                <Text style={{ margin: 0, fontSize: "14px" }}>{Number(totalVolume ?? 0).toFixed(2)} m³</Text>
              </Column>

              <Column style={{ paddingLeft: "12px" }}>
                <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "13px", marginBottom: "6px" }}>Precio logístico</Text>
                <Text style={{ margin: "0 0 12px 0", fontSize: "14px" }}>${Number(transportPrice ?? 0).toLocaleString()}</Text>

                <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "13px", marginBottom: "6px" }}>Precio almacenamiento (mensual)</Text>
                <Text style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700, color: colors.primary }}>
                  ${Number(storagePrice ?? totalPrice ?? 0).toLocaleString()}
                </Text>

                <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "13px", marginBottom: "6px" }}>Total cotización</Text>
                <Text style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: colors.primary }}>
                  ${Number((storagePrice ?? 0) + (transportPrice ?? 0)).toLocaleString()}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Artículos */}
          <Section style={{ padding: "0 20px 20px 20px" }} bgcolor="#ffffff" className="force-white">
            <Text style={{ fontWeight: 700, color: colors.primary, fontSize: "14px", margin: "0 0 8px 0" }}>
              Artículos cotizados:
            </Text>
            <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, background: "#ffffff" }} bgcolor="#ffffff">
              <thead>
                <tr style={{ background: colors.tableHeaderBg }}>
                  <th style={{ textAlign: "left", padding: "10px", fontSize: "13px", color: colors.text, background: colors.tableHeaderBg }} bgcolor={colors.tableHeaderBg}>Artículo</th>
                  <th style={{ textAlign: "center", padding: "10px", fontSize: "13px", color: colors.text, background: colors.tableHeaderBg }} bgcolor={colors.tableHeaderBg}>Cantidad</th>
                  <th style={{ textAlign: "right", padding: "10px", fontSize: "13px", color: colors.text, background: colors.tableHeaderBg }} bgcolor={colors.tableHeaderBg}>Volumen</th>
                </tr>
              </thead>
              <tbody>
                {hasItems ? (
                  items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${colors.border}`, background: "#ffffff" }} bgcolor="#ffffff">
                      <td style={{ padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }} bgcolor="#ffffff">{item.name}</td>
                      <td style={{ textAlign: "center", padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }} bgcolor="#ffffff">{item.quantity}</td>
                      <td style={{ textAlign: "right", padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }} bgcolor="#ffffff">
                        {Number(item.volume ?? 0).toFixed(2)} m³
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: "10px", fontSize: "13px", color: colors.muted, background: "#ffffff" }} bgcolor="#ffffff">
                      No se registraron artículos en esta cotización.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          {/* Footer */}
          <Section style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, background: "#ffffff" }} bgcolor="#ffffff" className="force-white">
            <Text style={{ margin: 0, fontSize: "13px", color: colors.muted }}>
              Si tienes dudas o quieres modificar tu cotización, contáctanos.
            </Text>
            <Text style={{ margin: "6px 0 0 0", fontSize: "13px", color: colors.primary, fontWeight: 700 }}>
              — Equipo Quarto
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
