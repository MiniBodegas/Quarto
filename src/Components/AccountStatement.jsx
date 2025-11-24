import { useMemo } from 'react';
import  Card  from './ui/Card';
import PaymentOptions from './PaymentOptions';
import { formatCurrency } from '../utils/formatters';

const AccountStatement = ({ user, invoices, onPrepayment, onSetupAutomaticPayment, onDisableAutomaticPayment }) => {
    
  const statementData = useMemo(() => {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const currentBalance = totalBilled - totalPaid - user.account_credit;
    return { totalBilled, totalPaid, currentBalance };
  }, [invoices, user.account_credit]);

  const sortedInvoices = useMemo(() => 
    [...invoices].sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()), 
    [invoices]
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Estado de Cuenta</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Facturado</h3>
            <p className="text-3xl font-bold text-text-primary">{formatCurrency(statementData.totalBilled)}</p>
        </Card>
        <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Pagado</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(statementData.totalPaid)}</p>
        </Card>
        <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Saldo a Favor</h3>
            <p className="text-3xl font-bold text-primary">{formatCurrency(user.account_credit)}</p>
        </Card>
        <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Saldo Pendiente</h3>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(statementData.currentBalance > 0 ? statementData.currentBalance : 0)}</p>
        </Card>
      </div>
      
      <PaymentOptions 
        user={user} 
        onPrepayment={onPrepayment}
        onSetupAutomaticPayment={onSetupAutomaticPayment}
        onDisableAutomaticPayment={onDisableAutomaticPayment}
      />

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Historial de Transacciones</h2>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Importe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    Factura #{invoice.invoice_number}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
            {sortedInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-background/80 p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-3">
                         <span className="font-bold text-text-primary">Factura #{invoice.invoice_number}</span>
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
                         </span>
                    </div>
                    <div className={`text-lg font-semibold mb-3 ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {formatCurrency(invoice.amount)}
                    </div>
                    <div className="text-sm text-text-secondary">
                        <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span className="font-medium">{invoice.issue_date}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {sortedInvoices.length === 0 && (
          <p className="text-center py-8 text-text-secondary">No hay transacciones registradas.</p>
        )}
      </Card>
    </div>
  );
};

export default AccountStatement;