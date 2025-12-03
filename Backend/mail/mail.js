import { Resend } from 'resend';
import express from 'express';
import 'dotenv/config';
import { createClient } from '../supabase.js';
import { render } from '@react-email/components';
import QuoteTemplate from './QuoteTemplate.jsx';


const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient();

const app = express();


app.get("/send-quote/:id", async (req, res) => {
    try {
      const quoteId = req.params.id;

    const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  
    if (error || !data) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const html = render(
      <BookingTemplate
        name={data.name}
        date={data.date}
        timeSlot={data.timeSlot}
        logisticsMethod={data.logisticsMethod}
        totalVolume={data.totalVolume}
        transportPrice={data.transportPrice}
        totalPrice={data.totalPrice}
        items={data.items}
        contactName={data.contactName}
        contactRole={data.contactRole}
        contactEmail={data.contactEmail}
        website={data.website}
        logoUrl={data.logoUrl}
        signatureUrl={data.signatureUrl}
      />
    )
  return res.status(200).json({ data } );
    } catch (error) {
         return res.status(400).json({ error });
        
    }
});

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});