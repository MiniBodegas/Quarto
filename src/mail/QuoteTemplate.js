import React from 'react';
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

export default function QuoteTemplate(props) {
  const {
    name, date, logisticsMethod, totalVolume, transportPrice,
    totalPrice, storagePrice, items, contactName, contactRole,
    contactEmail, website, logoUrl, bookingUrl = '#',
  } = props;

  const hasItems = Array.isArray(items) && items.length > 0;

  const colors = {
    bg: "#ffffff", card: "#ffffff", text: "#333333", muted: "#666666",
    primary: "#0B5FFF", border: "#EAEAEA", headerBg: "#ffffff",
    tableHeaderBg: "#F3F6FF", dark: "#012E58",
  };

  const containerStyle = {
    backgroundColor: colors.card, maxWidth: "680px", margin: "0 auto",
    borderRadius: "16px", boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    overflow: "hidden", border: `1px solid ${colors.border}`,
  };

  const sectionPadded = { padding: "20px", width: "100%" };

  return React.createElement(Html, null,
    React.createElement(Head, null,
      React.createElement('meta', { name: "color-scheme", content: "light" }),
      React.createElement('meta', { name: "supported-color-schemes", content: "light" }),
      React.createElement('style', { dangerouslySetInnerHTML: { __html: `
        :root { color-scheme: light only; }
        [data-ogsc] body, [data-ogsc] .force-white { background:#ffffff !important; color:#333333 !important; }
        @media (prefers-color-scheme: dark) {
          body, .force-white { background:#ffffff !important; color:#333333 !important; }
          .force-white table, .force-white td, .force-white th { background:#ffffff !important; }
        }
      ` }})
    ),
    React.createElement(Body, {
      className: "force-white",
      style: { backgroundColor: colors.bg, padding: "24px 12px", fontFamily: "Arial, sans-serif", color: colors.text },
      bgcolor: "#ffffff"
    },
      React.createElement(Container, { style: containerStyle, bgcolor: "#ffffff", className: "force-white" },
        // Cabecera
        React.createElement(Section, {
          style: { ...sectionPadded, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}` },
          bgcolor: "#ffffff", className: "force-white"
        },
          React.createElement(Row, null,
            React.createElement(Column, { style: { width: "64px", verticalAlign: "top" }},
              logoUrl && React.createElement('img', { src: logoUrl, alt: "Quarto", style: { height: "40px", borderRadius: "6px" }})
            ),
            React.createElement(Column, { style: { verticalAlign: "top" }},
              React.createElement(Heading, { style: { fontSize: "20px", margin: "0 0 6px 0", color: colors.dark }}, `Cotización para ${name}`),
              React.createElement(Text, { style: { margin: 0, color: colors.muted, fontSize: "13px" }}, `Fecha: ${date}`)
            ),
            React.createElement(Column, { style: { textAlign: "right", verticalAlign: "top" }},
              website && React.createElement('a', {
                href: `https://${website}`,
                style: { background: colors.primary, color: "#fff", fontWeight: 700, borderRadius: "20px", padding: "8px 14px", textDecoration: "none", fontSize: "13px", display: "inline-block" }
              }, website)
            )
          )
        ),

        // Contacto
        React.createElement(Section, { style: { ...sectionPadded, borderBottom: `1px solid ${colors.border}` }, bgcolor: "#ffffff", className: "force-white" },
          React.createElement(Row, null,
            React.createElement(Column, null,
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.dark }}, contactName),
              React.createElement(Text, { style: { margin: "4px 0 0 0", color: colors.muted }}, contactRole),
              React.createElement('a', { href: `mailto:${contactEmail}`, style: { marginTop: "6px", display: "inline-block", color: colors.primary, textDecoration: "none" }}, contactEmail)
            )
          )
        ),

        // RECIBO - Resumen estilo ticket
        React.createElement(Section, {
          style: {
            padding: "24px 20px",
            backgroundColor: "#F8F9FA",
            border: `2px solid ${colors.border}`,
            borderRadius: "12px",
            margin: "20px",
          },
          bgcolor: "#F8F9FA",
          className: "force-white"
        },
          // Fila 1: Método + Volumen
          React.createElement(Row, { style: { marginBottom: "16px" }},
            React.createElement(Column, { style: { paddingRight: "16px", borderRight: `1px solid ${colors.border}` }},
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}, "Método logístico"),
              React.createElement(Text, { style: { margin: "4px 0 0 0", fontSize: "16px", fontWeight: 600, color: colors.dark }}, logisticsMethod),
              React.createElement(Text, { style: { margin: "12px 0 0 0", fontWeight: 700, color: colors.muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}, "Volumen total"),
              React.createElement(Text, { style: { margin: "4px 0 0 0", fontSize: "16px", fontWeight: 600, color: colors.dark }}, `${Number(totalVolume ?? 0).toFixed(2)} m³`)
            ),
            React.createElement(Column, { style: { paddingLeft: "16px" }},
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}, "Precio logístico"),
              React.createElement(Text, { style: { margin: "4px 0 0 0", fontSize: "16px", fontWeight: 600, color: colors.dark }}, `$${Number(transportPrice ?? 0).toLocaleString()}`)
            )
          ),

          // Separador
          React.createElement('hr', { style: { margin: "16px 0", border: "none", borderTop: `1px dashed ${colors.border}`, height: 0 }}),

          // Fila 2: Almacenamiento
          React.createElement(Row, { style: { marginBottom: "16px" }},
            React.createElement(Column, null,
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}, "Precio almacenamiento (mensual)"),
              React.createElement(Text, { style: { margin: "4px 0 0 0", fontSize: "20px", fontWeight: 700, color: colors.primary }}, `$${Number(storagePrice ?? totalPrice ?? 0).toLocaleString()}`)
            )
          ),

          // Separador
          React.createElement('hr', { style: { margin: "16px 0", border: "none", borderTop: `2px solid ${colors.dark}`, height: 0 }}),

          // Fila 3: Total (destacado)
          React.createElement(Row, null,
            React.createElement(Column, null,
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}, "Total cotización"),
              React.createElement(Text, { style: { margin: "8px 0 0 0", fontSize: "28px", fontWeight: 900, color: colors.dark }}, `$${Number((storagePrice ?? 0) + (transportPrice ?? 0)).toLocaleString()}`)
            )
          )
        ),

        // CTA Reservar ahora
        React.createElement(Section, { style: { ...sectionPadded, textAlign: "center" }, bgcolor: "#ffffff", className: "force-white" },
          React.createElement('a', {
            href: bookingUrl,
            style: {
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: colors.primary,
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "15px",
              boxShadow: "0 8px 20px rgba(11,95,255,0.25)"
            }
          }, "🔒 Reservar ahora")
        ),

        // Artículos
        React.createElement(Section, { style: { padding: "0 20px 20px 20px" }, bgcolor: "#ffffff", className: "force-white" },
          React.createElement(Text, { style: { fontWeight: 700, color: colors.dark, fontSize: "14px", margin: "0 0 8px 0" }}, "Artículos cotizados:"),
          React.createElement('table', { style: { width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, background: "#ffffff" }, bgcolor: "#ffffff" },
            React.createElement('thead', null,
              React.createElement('tr', { style: { background: colors.tableHeaderBg }},
                React.createElement('th', { style: { textAlign: "left", padding: "10px", fontSize: "13px", color: colors.dark, background: colors.tableHeaderBg, fontWeight: 700 }, bgcolor: colors.tableHeaderBg }, "Artículo"),
                React.createElement('th', { style: { textAlign: "center", padding: "10px", fontSize: "13px", color: colors.dark, background: colors.tableHeaderBg, fontWeight: 700 }, bgcolor: colors.tableHeaderBg }, "Cantidad"),
                React.createElement('th', { style: { textAlign: "right", padding: "10px", fontSize: "13px", color: colors.dark, background: colors.tableHeaderBg, fontWeight: 700 }, bgcolor: colors.tableHeaderBg }, "Volumen")
              )
            ),
            React.createElement('tbody', null,
              hasItems
                ? items.map((item, idx) =>
                    React.createElement('tr', { key: idx, style: { borderTop: `1px solid ${colors.border}`, background: "#ffffff" }, bgcolor: "#ffffff" },
                      React.createElement('td', { style: { padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }, bgcolor: "#ffffff" }, item.name),
                      React.createElement('td', { style: { textAlign: "center", padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }, bgcolor: "#ffffff" }, item.quantity),
                      React.createElement('td', { style: { textAlign: "right", padding: "10px", fontSize: "13px", color: colors.text, background: "#ffffff" }, bgcolor: "#ffffff" }, `${Number(item.volume ?? 0).toFixed(2)} m³`)
                    )
                  )
                : React.createElement('tr', null,
                    React.createElement('td', { colSpan: 3, style: { padding: "10px", fontSize: "13px", color: colors.muted, background: "#ffffff" }, bgcolor: "#ffffff" }, "No se registraron artículos en esta cotización.")
                  )
            )
          )
        ),

        // Footer
        React.createElement(Section, { style: { padding: "16px 20px", borderTop: `1px solid ${colors.border}`, background: "#ffffff" }, bgcolor: "#ffffff", className: "force-white" },
          React.createElement(Text, { style: { margin: 0, fontSize: "13px", color: colors.muted }}, "Si tienes dudas o quieres modificar tu cotización, contáctanos."),
          React.createElement(Text, { style: { margin: "6px 0 0 0", fontSize: "13px", color: colors.primary, fontWeight: 700 }}, "— Equipo Quarto")
        )
      )
    )
  );
}
