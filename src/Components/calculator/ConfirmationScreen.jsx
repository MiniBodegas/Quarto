
import {Button} from '../index';



const ConfirmationScreen = ({ customerName, onReset }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 flex-grow flex flex-col justify-center text-center">
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-lg animate-fade-in">
                    <div className="mx-auto mb-6 bg-green-100 dark:bg-green-900/50 rounded-full h-20 w-20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">
                            check_circle
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight dark:text-slate-100">
                        ¡Reserva confirmada!
                    </h1>
                    
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                        Gracias, <strong>{customerName || 'por tu reserva'}</strong>. Hemos recibido tu solicitud con éxito.
                    </p>
                    
                    <p className="mt-2 text-md text-slate-500 dark:text-slate-400">
                        Recibirás un correo electrónico con los detalles. Un especialista de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para finalizar la coordinación.
                    </p>

                    <div className="mt-10">
                        <Button onClick={onReset}>
                            Realizar otro cálculo
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default ConfirmationScreen;