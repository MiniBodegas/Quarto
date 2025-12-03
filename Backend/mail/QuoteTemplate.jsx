import {
  Html,
  Head,
  Body,
  Text,
  Heading,
  Container,
  Section,
} from "@react-email/components";

export default function BookingTemplate({ name, date, timeSlot, items, totalVolume }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f7f7f7", padding: "20px" }}>
        <Container style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "16px" }}>
            ¡Gracias por tu reserva, {name}! 🎉
          </Heading>

          <Text>
            Hemos recibido la información de tu servicio con Quarto. Aquí te
            dejamos el resumen:
          </Text>

          <Section>
            <Text><strong>Fecha:</strong> {date}</Text>
            <Text><strong>Franja horaria:</strong> {timeSlot}</Text>
            <Text><strong>Volumen total:</strong> {totalVolume} m³</Text>
            <Text><strong>Artículos seleccionados:</strong></Text>

            <ul>
              {items?.map((item) => (
                <li key={item.id}>
                  {item.name} — {item.quantity} unidad(es)
                </li>
              ))}
            </ul>
          </Section>

          <Text style={{ marginTop: "20px" }}>
            Te contactaremos pronto para confirmar detalles.
          </Text>

          <Text>— Equipo Quarto</Text>
        </Container>
      </Body>
    </Html>
  );
}
