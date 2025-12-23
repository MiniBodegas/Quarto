import { Button } from '../index';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ConfirmationScreen = ({ customerName, transactionId, isAddingToExisting, invoiceInfo, paymentInfo, updateInfo, onReset }) => {
  const navigate = useNavigate();

  // ✅ Limpiar datos de sesión cuando llegue a confirmación
  useEffect(() => {
    console.log('[ConfirmationScreen] 🧹 Limpiando datos de sesión');
    localStorage.removeItem('quarto_booking_form');
    localStorage.removeItem('quarto_current_booking_id');
    localStorage.removeItem('quarto_inventory');
    localStorage.removeItem('quarto_logistics_method');
    localStorage.removeItem('quarto_transport');
  }, []);

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
            <span>✅</span> {isAddingToExisting ? 'Items agregados' : 'Reserva exitosa'}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#012E58]">
            {isAddingToExisting ? '¡Items agregados exitosamente!' : '¡Reserva confirmada!'}
          </h1>

          <p className="mt-4 text-lg text-[#012E58]">
            {isAddingToExisting ? (
              <>Los items se han agregado a tu inventario correctamente.</>
            ) : (
              <>Gracias, <strong>{customerName || 'por tu reserva'}</strong>. Hemos recibido tu solicitud con éxito.</>
            )}
          </p>

          <p className="mt-3 text-sm text-[#012E58]/80 max-w-xl mx-auto">
            {isAddingToExisting ? (
              'Puedes ver todos tus items en la sección "Mi Inventario" de tu portal.'
            ) : (
              'Recibirás un correo electrónico con los detalles. Un especialista de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para finalizar la coordinación.'
            )}
          </p>

          {/* ✅ Mostrar número de transacción si existe */}
          {transactionId && !isAddingToExisting && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm font-medium text-blue-900 mb-1">
                🎫 Número de Transacción
              </p>
              <p className="text-xs text-blue-700 font-mono bg-white px-3 py-2 rounded-lg border border-blue-100">
                {transactionId}
              </p>
            </div>
          )}

          {/* ✅ Mostrar info de actualización si existe (modo agregar items) */}
          {isAddingToExisting && updateInfo && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-green-600">update</span>
                <p className="text-sm font-bold text-green-900">
                  Inventario Actualizado
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items agregados:</span>
                  <span className="font-semibold text-gray-800">{updateInfo.itemsAdded}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Volumen adicional:</span>
                  <span className="font-semibold text-gray-800">+{updateInfo.volumeAdded.toFixed(2)} m³</span>
                </div>
                {updateInfo.previousVolume !== undefined && (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Volumen anterior:</span>
                      <span>{Number(updateInfo.previousVolume).toFixed(2)} m³</span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-700">Volumen total ahora:</span>
                      <span className="text-blue-700">{updateInfo.newTotalVolume.toFixed(2)} m³</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                    <span>Monto mensual anterior:</span>
                    <span className="line-through">${Number(updateInfo.previousMonthlyPrice).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Nuevo monto mensual:</span>
                    <span className="font-bold text-lg text-green-700">
                      ${updateInfo.newMonthlyPrice.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-700 mt-2 text-center font-semibold">
                ✅ El nuevo monto se cobrará a partir del próximo mes
              </p>
              <p className="text-xs text-gray-600 mt-1 text-center">
                No se requiere pago adicional inmediato
              </p>
            </div>
          )}

          {/* ✅ Mostrar info de factura (legacy/compatibilidad) */}
          {isAddingToExisting && invoiceInfo && !paymentInfo && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-purple-600">receipt_long</span>
                <p className="text-sm font-bold text-purple-900">
                  Factura Generada
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">N° Factura:</span>
                  <span className="font-mono font-semibold text-purple-700">{invoiceInfo.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items agregados:</span>
                  <span className="font-semibold text-gray-800">{invoiceInfo.itemsAdded}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Volumen adicional:</span>
                  <span className="font-semibold text-gray-800">{invoiceInfo.volumeAdded.toFixed(2)} m³</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-gray-600">Nuevo monto mensual:</span>
                  <span className="font-bold text-lg text-purple-700">
                    ${invoiceInfo.amount.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-purple-700 mt-2 text-center">
                Estado: <span className="font-semibold">PENDIENTE DE PAGO</span>
              </p>
            </div>
          )}

          <div className="mt-10 flex gap-3 justify-center">
            {isAddingToExisting ? (
              <>
                <Button 
                  onClick={() => {
                    // ✅ Marcar que se completó la adición de items
                    localStorage.setItem('quarto_adding_items', 'completed');
                    navigate('/user');
                  }} 
                  className="!py-2.5 font-bold shadow-lg hover:shadow-xl"
                >
                  Volver al Portal
                </Button>
                <Button 
                  onClick={onReset}
                  variant="outline"
                  className="!py-2.5 font-bold"
                >
                  Agregar más items
                </Button>
              </>
            ) : (
              <Button onClick={onReset} className="!py-2.5 font-bold shadow-lg hover:shadow-xl">
                Realizar otro cálculo
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmationScreen;