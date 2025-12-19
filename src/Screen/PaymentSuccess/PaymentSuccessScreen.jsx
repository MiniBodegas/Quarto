import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CompleteRegistration } from '../../Components';
import { supabase } from '../../supabase';
import { QUARTO_LOGO_BASE64 } from '../../utils/constants';

/**
 * Pantalla que se muestra después de un pago exitoso
 * Permite al usuario completar su registro con contraseña
 */
const PaymentSuccessScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError('');

        // Obtener el ID del booking desde la URL o localStorage
        const bookingId = searchParams.get('booking_id') || localStorage.getItem('quarto_current_booking_id');

        if (!bookingId) {
          console.error('[PaymentSuccess] No se encontró booking_id');
          setError('No se encontró información de la reserva');
          return;
        }

        console.log('[PaymentSuccess] Cargando booking:', bookingId);

        // Obtener datos del booking desde Supabase
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          console.error('[PaymentSuccess] Error obteniendo booking:', bookingError);
          setError('No se pudo cargar la información de la reserva');
          return;
        }

        // Ya no verificamos payment_status porque el pago es DESPUÉS del registro
        console.log('[PaymentSuccess] ✅ Booking cargado (pago pendiente):', booking);
        setBookingData(booking);

        // Limpiar el localStorage
        localStorage.removeItem('quarto_current_booking_id');

      } catch (err) {
        console.error('[PaymentSuccess] Error:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [searchParams, navigate]);

  const handleSkipRegistration = () => {
    console.log('[PaymentSuccess] Usuario saltó el registro');
    navigate('/', { 
      state: { 
        message: 'Reserva confirmada. Puedes crear tu cuenta más tarde desde /login' 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-6" />
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <span className="material-symbols-outlined text-4xl text-red-600 mb-2">error</span>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">No se encontró información de la reserva</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompleteRegistration
      bookingData={bookingData}
      onSkip={handleSkipRegistration}
    />
  );
};

export default PaymentSuccessScreen;
