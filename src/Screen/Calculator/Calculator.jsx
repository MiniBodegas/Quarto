import  { useReducer, useEffect,useState,useCallback, useMemo } from 'react';
import { supabase } from '../../supabase';
import { useItemsByCategory, useInventory } from '../../hooks';
import { AddItemForm, Summary, ConfirmModal, ItemCard, ResultsScreen, TransportScreen, FinalSummaryScreen, QuoteRequestScreen, BookingScreen, ConfirmationScreen, ScreenHeader, Input, Button } from '../../Components';
import { SearchIcon, ChevronDownIcon } from '../../Components/calculator/icons';
import {InventoryPhotoScreen} from '../index';
import {saveCustomItem} from '../../services/saveCustomItem';

// --- State Management with Reducer ---

const initialState = {
    view: 'calculator',
    logisticsMethod: null,
    transportPrice: null,
    customerName: null,
};

function appReducer(state, action) {
    switch (action.type) {
        case 'NAVIGATE_TO':
            return { ...state, view: action.payload };

        case 'SELECT_LOGISTICS':
            return {
                ...state,
                logisticsMethod: action.payload,
                view: action.payload === 'Recogida' ? 'transport' : 'finalSummary',
            };
        case 'SET_TRANSPORT_PRICE':
            return { ...state, view: 'finalSummary', transportPrice: action.payload };
        case 'CONFIRM_BOOKING':
            return { ...state, view: 'confirmation', customerName: action.payload.name };
        case 'RESET_APP':
            return { ...initialState };
        case 'GO_BACK': {
            switch (state.view) {
                case 'logistics':
                    return { ...initialState, view: 'calculator' };
                case 'transport':
                    return { ...state, view: 'logistics', transportPrice: null };
                case 'finalSummary':
                    return { 
                        ...state, 
                        view: state.logisticsMethod === 'Recogida' ? 'transport' : 'logistics' 
                    };
                case 'quoteRequest':
                    return { ...state, view: 'finalSummary' };
                case 'booking':
                    return { ...state, view: 'finalSummary' };
                case 'confirmation':
                    return { ...initialState };
                default:
                    return state;
            }
        }
        default:
            return state;
    }
}

// --- Main App Component ---
const Calculator = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { items, updateItemQuantity, addItem, removeItem, clearAll } = useInventory();
    
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [isAddFormExpanded, setIsAddFormExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isStyled, setIsStyled] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Usa tu hook para obtener categorías y artículos agrupados
    const { categories, itemsByCategory, loading } = useItemsByCategory();

    useEffect(() => {
        const timer = setTimeout(() => setIsStyled(true), 150);
        return () => clearTimeout(timer);
    }, []);
    
    // --- Memoized Callbacks for Child Components ---
    
    let userId = undefined; // El usuario aún no existe

    // Si tienes lógica de autenticación, aquí lo actualizas cuando el usuario se registre/inicie sesión
    // Ejemplo:
    // userId = session?.user?.id;

    // Función para guardar el inventario en localStorage
    function saveInventoryToLocal(items) {
    localStorage.setItem('quarto_inventory', JSON.stringify(items));
}

    const handleAddItem = useCallback((newItemData) => {
        const fullNewItem = addItem({ ...newItemData, isCustom: true });
        // Guarda el inventario actualizado en localStorage
        const updatedItems = [...items, fullNewItem];
        localStorage.setItem('quarto_inventory', JSON.stringify(updatedItems));
        setExpandedCategories(prev => new Set(prev).add(fullNewItem.categoryId));
        setIsAddFormExpanded(false);
    }, [addItem, items]);

    const handleClearAll = useCallback(() => {
        setShowConfirmModal(true);
    }, []);

    const handleConfirmClear = () => {
        clearAll();
        setSearchQuery('');
        setExpandedCategories(new Set());
        dispatch({ type: 'RESET_APP' });
        setShowConfirmModal(false);
    };

    const handleCancelClear = () => {
        setShowConfirmModal(false);
    };

    const handleRemoveSelectedItem = useCallback((id) => {
        const item = items.find(i => i.id === id);
        if (item?.isCustom) {
            removeItem(id);
        } else {
            updateItemQuantity(id, 0);
        }
    }, [items, removeItem, updateItemQuantity]);

    const handleToggleCategory = useCallback((categoryId) => {
        if (searchQuery) return;
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
            return newSet;
        });
    }, [searchQuery]);

    // --- Memoized Derived State ---
    // Calcula el total usando los items del inventario local (puedes adaptar para usar los de la DB si lo deseas)
    const { totalVolume, totalItems } = useMemo(() => {
        return items.reduce(
            (acc, item) => {
                acc.totalVolume += item.volume * item.quantity;
                acc.totalItems += item.quantity;
                return acc;
            },
            { totalVolume: 0, totalItems: 0 }
        );
    }, [items]);
    
    const selectedItems = useMemo(() => items.filter(item => item.quantity > 0), [items]);

    // --- Render Logic ---
    const opacityClass = `transition-opacity duration-500 ${isStyled ? 'opacity-100' : 'opacity-0'}`;

    const renderScreen = () => {
        switch (state.view) {
            case 'inventoryPhotos':
                return (
                    <InventoryPhotoScreen
                        selectedItems={selectedItems}
                        onBack={() => dispatch({ type: 'GO_BACK' })}
                        onContinue={(photos) => {
                            // Guarda las fotos en localStorage o en el estado global
                            localStorage.setItem('quarto_inventory_photos', JSON.stringify(photos));
                            dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
                        }}
                    />
                )
            case 'logistics':
                return (
                    <ResultsScreen 
                        totalVolume={totalVolume} 
                        totalItems={totalItems}
                        onBack={() => dispatch({ type: 'GO_BACK' })} 
                        onContinue={(method) => dispatch({ type: 'SELECT_LOGISTICS', payload: method })}
                    />
                );
            case 'transport':
                return (
                    <TransportScreen 
                        totalVolume={totalVolume}
                        onContinue={(price) => dispatch({ type: 'SET_TRANSPORT_PRICE', payload: price })}
                        onBack={() => dispatch({ type: 'GO_BACK' })}
                    />
                );
            case 'finalSummary':
                return (
                    <FinalSummaryScreen
                        totalVolume={totalVolume}
                        totalItems={totalItems}
                        logisticsMethod={state.logisticsMethod}
                        transportPrice={state.transportPrice}
                        onBack={() => dispatch({ type: 'GO_BACK' })}
                        onGoToQuote={() => dispatch({ type: 'NAVIGATE_TO', payload: 'quoteRequest' })}
                        onBookService={() => dispatch({ type: 'NAVIGATE_TO', payload: 'booking' })}
                    />
                );
            case 'quoteRequest':
                return (
                    <QuoteRequestScreen
                        totalVolume={totalVolume}
                        totalItems={totalItems}
                        logisticsMethod={state.logisticsMethod}
                        transportPrice={state.transportPrice}
                        selectedItems={selectedItems}
                        onBack={() => dispatch({ type: 'GO_BACK' })}
                       onSuccess={(name) => dispatch({ type: 'CONFIRM_BOOKING', payload: { name } })}
                    />
                );
            case 'booking':
                return (
                    <BookingScreen
                        totalVolume={totalVolume}
                        totalItems={totalItems}
                        logisticsMethod={state.logisticsMethod}
                        transportPrice={state.transportPrice}
                        onBack={() => dispatch({ type: 'GO_BACK' })}
                        onConfirm={(name) => dispatch({ type: 'CONFIRM_BOOKING', payload: { name } })}
                    />
                );
            case 'confirmation':
                return (
                    <ConfirmationScreen 
                        customerName={state.customerName}
                        onReset={() => {
                            clearAll();
                            dispatch({ type: 'RESET_APP' });
                        }}
                    />
                );
            case 'calculator':
            default:
                return (
                    <div className="w-full px-4 sm:px-6 lg:px-8 flex-grow">
                        <ScreenHeader 
                            title="Calcula tu espacio"
                            subtitle="Selecciona los artículos que tienes para almacenar."
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 space-y-6">
                                
                                <Input
                                    id="search-items"
                                    label="Buscar artículo por nombre"
                                    hideLabel
                                    placeholder="Buscar artículo por nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={<SearchIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                    className="py-3 pr-4"
                                />

                                {loading ? (
                                    <div className="text-center py-8 text-slate-500">Cargando artículos...</div>
                                ) : (
                                    categories.map(category => {
                                        const categoryItems = searchQuery
                                            ? itemsByCategory[category.id]?.filter(item =>
                                                item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            : itemsByCategory[category.id];
                                        if (!categoryItems || categoryItems.length === 0) return null;
                                        const isExpanded = !!searchQuery || expandedCategories.has(category.id);

                                        return (
                                            <div
                                                key={category.id}
                                                className="bg-white rounded-2xl border border-border dark:border-border-dark mb-6 max-w-full overflow-hidden"
                                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                            >
                                                <button
                                                    onClick={() => handleToggleCategory(category.id)}
                                                    className={`w-full flex justify-between items-center p-4 sm:p-5 text-left ${!searchQuery ? 'cursor-default' : ''}`}
                                                    aria-expanded={isExpanded}
                                                >
                                                    <h2 className="text-xl font-bold text-[#012E58]">{category.name}</h2>
                                                    <div className="bg-muted dark:bg-secondary-dark rounded-full p-1">
                                                        <ChevronDownIcon className={`w-5 h-5 text-text-light text-[#012E58] transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </button>
                                                {isExpanded && (
                                                    <div
                                                        className="px-5 sm:px-6 pb-6 border-t border-border dark:border-slate-700 text-[#012E58]"
                                                    >
                                                        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                                                            {categoryItems.map(item => {
                                                                // Busca el artículo en el inventario para obtener el quantity actualizado
                                                                const inventoryItem = items.find(i => i.id === item.id);
                                                                const mergedItem = inventoryItem ? { ...item, quantity: inventoryItem.quantity } : { ...item, quantity: 0 };
                                                                return (
                                                                    <ItemCard
                                                                        key={item.id}
                                                                        item={mergedItem}
                                                                        onQuantityChange={updateItemQuantity}
                                                                        onRemove={removeItem}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}

                                <div className="bg-white rounded-2xl border  border-border dark:border-border-dark">
                                    <button onClick={() => setIsAddFormExpanded(p => !p)} className="w-full flex justify-between items-center p-4 sm:p-5 text-left" aria-expanded={isAddFormExpanded}>
                                        <h2 className="text-xl font-bold text-[#012E58]">Añadir artículo personalizado</h2>
                                        <div className="bg-muted dark:bg-secondary-dark rounded-full p-1">
                                            <ChevronDownIcon className={`w-5 h-5 text-text-light dark:text-slate-400 transform transition-transform duration-300 ${isAddFormExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    {isAddFormExpanded && (
                                        <div className="px-5 sm:px-6 pb-6 border-t border-border dark:border-slate-700">
                                            <div className="pt-6"><AddItemForm onAddItem={handleAddItem} categories={categories} /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <aside className="lg:sticky top-8 self-start space-y-8 w-full">
                                <Summary 
                                    totalVolume={totalVolume} 
                                    totalItems={totalItems} 
                                    selectedItems={selectedItems}
                                    onContinue={() => {
                                        saveInventoryToLocal(selectedItems); // Guarda en localStorage al continuar
                                        dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
                                    }}
                                    onClearAll={handleClearAll}
                                    onRemoveItem={handleRemoveSelectedItem}
                                />
                            </aside>
                        </div>
                    </div>
                );
        }
    };

    useEffect(() => {
        const quoteId = new URLSearchParams(window.location.search).get('quoteId');
        if (!quoteId) return;

        (async () => {
          try {
            // 1) Traer cotización - SINTAXIS CORRECTA
            const { data: quote, error: quoteError } = await supabase
              .from('quotes')
              .select('*')
              .eq('id', quoteId)
              .single();
            
            if (quoteError || !quote) {
              console.error('Error cargando cotización:', quoteError);
              return;
            }

            // 2) Traer inventario asociado DE LA DB
            const { data: inv, error: invError } = await supabase
              .from('inventory')
              .select('*')
              .eq('quote_id', quoteId);
            
            if (invError) {
              console.error('Error cargando inventario:', invError);
              return;
            }

            // 3) Mapear a tu forma local
            const mapped = (inv || []).map((r) => ({
              id: r.item_id || r.custom_item_id || r.id,
              name: r.name,
              volume: Number(r.volume) || 0,
              quantity: Number(r.quantity) || 0,
              isCustom: r.is_custom,
              width: r.width,
              height: r.height,
              depth: r.depth,
            }));

            // 4) CARGAR ITEMS DIRECTAMENTE AL HOOK
            clearAll();
            mapped.forEach((m) => {
              const added = addItem(m);
              if (m.quantity > 1) {
                updateItemQuantity(added.id, m.quantity);
              }
            });

            // 5) Prellenar datos del usuario
            localStorage.setItem('quarto_user', JSON.stringify({
              name: quote.name,
              email: quote.email,
              phone: quote.phone,
            }));

            // 6) Guardar método logístico
            localStorage.setItem('quarto_logistics_method', quote.logistics_method);
            
            // 7) Si hay transporte, guardarlo
            if (quote.logistics_method === 'Recogida' && quote.Trasnport_id) {
              const { data: transport, error: transportError } = await supabase
                .from('transports')
                .select('*')
                .eq('id', quote.Trasnport_id)
                .single();
              
              if (transportError) {
                console.error('Error cargando transporte:', transportError);
              } else if (transport) {
                localStorage.setItem('quarto_transport', JSON.stringify(transport));
              }
            }

            // 8) Hidratar estado del reducer
            dispatch({
              type: 'SELECT_LOGISTICS',
              payload: quote.logistics_method === 'Recogida' ? 'Recogida' : 'En bodega',
            });
            if (quote.transport_price != null) {
              dispatch({ type: 'SET_TRANSPORT_PRICE', payload: quote.transport_price });
            }

            // 9) Limpiar query string
            window.history.replaceState({}, '', window.location.pathname);

            // 10) Navegar a booking
            dispatch({ type: 'NAVIGATE_TO', payload: 'booking' });
          } catch (error) {
            console.error('Error en useEffect quoteId:', error);
          }
        })();
    }, [dispatch, addItem, updateItemQuantity, clearAll]);

    return (
        <div className={`Calculator ${opacityClass} flex flex-col h-screen overflow-hidden`}>
            {renderScreen()}
            {showConfirmModal && (
                <ConfirmModal
                    title="¿Estás seguro de que quieres limpiar todo?"
                    message="Esto eliminará todos los artículos de tu inventario."
                    onConfirm={handleConfirmClear}
                    onCancel={handleCancelClear}
                />
            )}
        </div>
    );
};

export default Calculator;

