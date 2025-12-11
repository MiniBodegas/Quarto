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

  const totalItems =
    Array.isArray(items)
      ? items.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
      : 0;

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
        img { filter: none !important; }
      ` }})
    ),
    React.createElement(Body, {
      style: { 
        backgroundColor: "#ffffff", 
        padding: "24px 12px", 
        fontFamily: "Arial, sans-serif", 
        color: "#333333" 
      },
      bgcolor: "#ffffff"
    },
      React.createElement(Container, { 
        style: containerStyle, 
        bgcolor: "#ffffff"
      },
        // Cabecera
        React.createElement(Section, {
          style: { ...sectionPadded, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}` },
          bgcolor: "#ffffff"
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
        React.createElement(Section, { style: { ...sectionPadded, borderBottom: `1px solid ${colors.border}` }, bgcolor: "#ffffff" },
          React.createElement(Row, null,
            React.createElement(Column, null,
              React.createElement(Text, { style: { margin: 0, fontWeight: 700, color: colors.dark }}, contactName),
              React.createElement(Text, { style: { margin: "4px 0 0 0", color: colors.muted }}, contactRole),
              React.createElement('a', { href: `mailto:${contactEmail}`, style: { marginTop: "6px", display: "inline-block", color: colors.primary, textDecoration: "none" }}, contactEmail)
            )
          )
        ),

        // Resumen
        React.createElement(Section, {
          style: {
            padding: "20px",
            backgroundColor: "#F8F9FA",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            margin: "20px",
            width: "calc(100% - 40px)",
          },
          bgcolor: "#F8F9FA"
        },
          React.createElement(Row, { style: { marginBottom: "12px" }},
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", color: "#666666" }}, "Total de artículos:")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#012E58" }}, `${totalItems} uds`)
            )
          ),

           React.createElement(Row, { style: { marginBottom: "12px" }},
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", color: "#666666" }}, "Volumen total:")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#012E58" }}, `${Number(totalVolume ?? 0).toFixed(2)} m³`)
            )
          ),

           React.createElement(Row, { style: { marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px dashed ${colors.border}` }},
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", color: "#666666" }}, "Almacenamiento (mensual):")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#012E58" }}, `$${Number(storagePrice ?? totalPrice ?? 0).toLocaleString()}`)
            )
          ),

          React.createElement(Row, { style: { marginBottom: "12px" }},
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", color: "#666666" }}, "Método logístico:")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#012E58" }}, logisticsMethod)
            )
          ),

          React.createElement(Row, { style: { marginBottom: "12px" }},
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", color: "#666666" }}, "Valor del transporte:")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "#012E58" }}, `$${Number(transportPrice ?? 0).toLocaleString()}`)
            )
          ),

         

          React.createElement(Row, null,
            React.createElement(Column, { style: { textAlign: "left", paddingRight: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "16px", fontWeight: 900, color: "#012E58" }}, "Total cotización:")
            ),
            React.createElement(Column, { style: { textAlign: "right", paddingLeft: "10px" }},
              React.createElement(Text, { style: { margin: 0, fontSize: "18px", fontWeight: 900, color: "#0B5FFF" }}, `$${Number((storagePrice ?? 0) + (transportPrice ?? 0)).toLocaleString()}`)
            )
          )
        ),

        // CTA Reservar ahora
        React.createElement(Section, { style: { ...sectionPadded, textAlign: "center" }, bgcolor: "#ffffff" },
          React.createElement('a', {
            href: bookingUrl,
            style: {
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: "#0B5FFF",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "15px",
              boxShadow: "0 8px 20px rgba(11,95,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }
          }, "Reservar ahora")
        ),

        // Artículos
        React.createElement(Section, { style: { padding: "0 20px 20px 20px" }, bgcolor: "#ffffff" },
          React.createElement(Text, { style: { fontWeight: 700, color: colors.dark, fontSize: "14px", margin: "0 0 8px 0" }}, "Artículos cotizados:"),
          React.createElement('table', { style: { width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, background: "#ffffff" }, bgcolor: "#ffffff" },
            React.createElement('thead', null,
              React.createElement('tr', { style: { background: "#0B5FFF" }},
                React.createElement('th', { style: { textAlign: "left", padding: "10px", fontSize: "13px", color: "#ffffff", background: "#0B5FFF", fontWeight: 700 }, bgcolor: "#0B5FFF" }, "Artículo"),
                React.createElement('th', { style: { textAlign: "center", padding: "10px", fontSize: "13px", color: "#ffffff", background: "#0B5FFF", fontWeight: 700 }, bgcolor: "#0B5FFF" }, "Cantidad"),
                React.createElement('th', { style: { textAlign: "right", padding: "10px", fontSize: "13px", color: "#ffffff", background: "#0B5FFF", fontWeight: 700 }, bgcolor: "#0B5FFF" }, "Volumen")
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
        React.createElement(Section, { style: { padding: "16px 20px", borderTop: `1px solid ${colors.border}`, background: "#ffffff" }, bgcolor: "#ffffff" },
          React.createElement(Text, { style: { margin: 0, fontSize: "13px", color: colors.muted }}, "Si tienes dudas o quieres modificar tu cotización, contáctanos."),
          React.createElement(Text, { style: { margin: "6px 0 0 0", fontSize: "13px", color: colors.primary, fontWeight: 700 }}, "— Equipo Quarto")
        )
      )
    )
  );
}
