import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import { supabase } from '../../supabase';

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuote, setExpandedQuote] = useState(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);

      // Cargar cotizaciones con sus items
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error cargando cotizaciones:', quotesError);
        return;
      }

      // Para cada cotización, cargar sus items del inventario
      const quotesWithItems = await Promise.all(
        quotesData.map(async (quote) => {
          const { data: items, error: itemsError } = await supabase
            .from('inventory')
            .select('name, quantity, volume')
            .eq('quote_id', quote.id);

          if (itemsError) {
            console.error(`Error cargando items de cotización ${quote.id}:`, itemsError);
            return { ...quote, items: [] };
          }

          return {
            ...quote,
            items: items || [],
          };
        })
      );

      setQuotes(quotesWithItems);
    } catch (error) {
      console.error('Error en loadQuotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const search = searchTerm.toLowerCase();
    return (
      quote.name?.toLowerCase().includes(search) ||
      quote.email?.toLowerCase().includes(search) ||
      quote.phone?.toLowerCase().includes(search)
    );
  });

  const toggleExpand = (quoteId) => {
    setExpandedQuote(expandedQuote === quoteId ? null : quoteId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Cotizaciones</h1>
          <p className="text-text-secondary mt-1">
            Total: {quotes.length} cotización{quotes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button onClick={loadQuotes}>
          <span className="material-symbols-outlined text-sm mr-2">refresh</span>
          Actualizar
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          label="Buscar cotización"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<span className="material-symbols-outlined">search</span>}
        />
      </Card>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((quote) => (
            <Card key={quote.id} className="p-6">
              {/* Quote Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-text-primary">
                      {quote.name || 'Sin nombre'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quote.logistics_method === 'Recogida'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {quote.logistics_method || 'Sin método'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">email</span>
                      <span>{quote.email || 'Sin email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      <span>{quote.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      <span>{formatDate(quote.created_at)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => toggleExpand(quote.id)}
                  className="ml-4"
                >
                  <span className="material-symbols-outlined">
                    {expandedQuote === quote.id ? 'expand_less' : 'expand_more'}
                  </span>
                </Button>
              </div>

              {/* Quote Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 font-medium mb-1">Total Items</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {quote.total_items || 0}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 font-medium mb-1">Volumen Total</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Number(quote.total_volume || 0).toFixed(2)} m³
                  </div>
                </div>

                {quote.transport_price > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium mb-1">Transporte</div>
                    <div className="text-lg font-bold text-green-900">
                      {formatCurrency(quote.transport_price)}
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-xs text-indigo-600 font-medium mb-1">Items Listados</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {quote.items?.length || 0}
                  </div>
                </div>
              </div>

              {/* Expanded Details - Items List */}
              {expandedQuote === quote.id && quote.items?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    Items de la cotización:
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                            Nombre
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-text-secondary uppercase">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                            Volumen Unit.
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                            Volumen Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-border">
                        {quote.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-text-primary">
                              {item.name || 'Sin nombre'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-text-secondary">
                              {item.quantity || 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-text-secondary">
                              {Number(item.volume || 0).toFixed(2)} m³
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-text-primary">
                              {(Number(item.volume || 0) * Number(item.quantity || 1)).toFixed(2)} m³
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-3 text-sm font-semibold text-text-primary text-right"
                          >
                            Volumen Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-primary text-right">
                            {quote.items
                              .reduce(
                                (sum, item) =>
                                  sum + Number(item.volume || 0) * Number(item.quantity || 1),
                                0
                              )
                              .toFixed(2)}{' '}
                            m³
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">
              request_quote
            </span>
            <p className="text-text-secondary">
              {searchTerm
                ? 'No se encontraron cotizaciones con ese criterio'
                : 'No hay cotizaciones registradas'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminQuotes;
