import { Button } from '../index';

const ConfirmationScreen = ({ customerName, onReset }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex-grow flex flex-col justify-center py-12">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center animate-fade-in">
          {/* Ícono de éxito */}
          <div className="mx-auto mb-6 bg-green-50 rounded-full h-20 w-20 flex items-center justify-center border-2 border-green-200">
            <span className="material-symbols-outlined text-5xl text-green-600">
              check_circle
            </span>
          </div>

          {/* Chip de estado */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-4">
            <span>✅</span> Reserva exitosa
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#012E58]">
            ¡Reserva confirmada!
          </h1>

          <p className="mt-4 text-lg text-[#012E58]">
            Gracias, <strong>{customerName || 'por tu reserva'}</strong>. Hemos recibido tu solicitud con éxito.
          </p>

          <p className="mt-3 text-sm text-[#012E58]/80 max-w-xl mx-auto">
            Recibirás un correo electrónico con los detalles. Un especialista de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para finalizar la coordinación.
          </p>

          <div className="mt-10">
            <Button onClick={onReset} className="!py-2.5 font-bold shadow-lg hover:shadow-xl">
              Realizar otro cálculo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmationScreen;