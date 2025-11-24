import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../utils/formatters';

const Dashboard = ({ company, loginUserName, invoices, setView, isRecentLogin }) => {
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  const totalBalance = unpaidInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          {isRecentLogin ? '¡Bienvenido de nuevo,' : '¡Bienvenido,'} {loginUserName.split(' ')[0]}!
        </h1>
        <p className="text-text-secondary mt-1">Aquí tienes un resumen de la cuenta de <strong>{company.name}</strong>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-secondary">Saldo Pendiente</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <p className="text-4xl font-bold mt-4 text-text-primary">{formatCurrency(totalBalance)}</p>
          <p className="text-sm text-text-secondary mt-1">{unpaidInvoices.length} factura(s) sin pagar</p>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-secondary">Facturas Vencidas</h3>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-4xl font-bold mt-4 text-red-600">{overdueInvoices.length}</p>
          <p className="text-sm text-text-secondary mt-1">Por favor, páguelas lo antes posible</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-secondary">Acciones Rápidas</h3>
            <p className="text-sm text-text-secondary mt-1">Gestiona tu cuenta y pagos.</p>
          </div>
          <div className="mt-4 flex flex-col space-y-2">
            <Button onClick={() => setView('invoices')}>Ver y Pagar Facturas</Button>
            <Button onClick={() => setView('contact')} variant="secondary">Editar Datos de la Cuenta</Button>
          </div>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Facturas Recientes</h2>
        <Card>
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {invoices.slice(0, 3).map((invoice, idx) => (
                    <li key={invoice.id}>
                        <div className="relative pb-8">
                        {idx !== invoices.slice(0, 3).length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-center">
                            <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card ${
                                    invoice.status === 'paid' ? 'bg-green-500' :
                                    invoice.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                                }`}>
                                     {invoice.status === 'paid' ? <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : 
                                     <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 6a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2H4z" clipRule="evenodd" /></svg>
                                    }
                                </span>
                            </div>
                            <div className="min-w-0 flex-1 flex justify-between space-x-4">
                                <div>
                                    <p className="text-sm text-text-secondary">Factura <span className="font-medium text-text-primary">#{invoice.invoice_number}</span></p>
                                    <p className="text-sm text-text-secondary">Vencimiento: {invoice.due_date}</p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-text-secondary">
                                    <span className="font-semibold text-lg text-text-primary">{formatCurrency(invoice.amount)}</span>
                                </div>
                            </div>
                        </div>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
            <div className="mt-6">
                <Button onClick={() => setView('invoices')} variant="secondary" className="w-full">
                    Ver Todas las Facturas
                </Button>
            </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;