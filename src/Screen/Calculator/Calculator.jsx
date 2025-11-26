import { useState, useMemo, useCallback, useEffect, useReducer } from 'react';
import { CATEGORIES } from '../../data/constants';
import { useInventory } from '../../Hooks/useInventory';
import { AddItemForm, Summary, ItemCard, ResultsScreen, TransportScreen, FinalSummaryScreen, QuoteRequestScreen, BookingScreen, ConfirmationScreen, ScreenHeader, Input, Button } from '../../Components';
import { SearchIcon, ChevronDownIcon } from '../../Components/calculator/icons';

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
                    return { ...initialState };
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

    useEffect(() => {
        const timer = setTimeout(() => setIsStyled(true), 150);
        return () => clearTimeout(timer);
    }, []);
    
    // --- Memoized Callbacks for Child Components ---
    
    const handleAddItem = useCallback((newItemData) => {
        const fullNewItem = addItem(newItemData);
        setExpandedCategories(prev => new Set(prev).add(fullNewItem.categoryId));
        setIsAddFormExpanded(false);
    }, [addItem]);

    const handleClearAll = useCallback(() => {
        if (window.confirm('¿Estás seguro de que quieres vaciar el inventario? Se eliminarán los artículos personalizados y las cantidades de los artículos predefinidos se restablecerán a cero.')) {
            clearAll();
            setSearchQuery('');
            setExpandedCategories(new Set());
            dispatch({ type: 'RESET_APP' });
        }
    }, [clearAll]);

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

    const itemsByCategory = useMemo(() => {
        const grouped = {};
        CATEGORIES.forEach(cat => grouped[cat.id] = []);

        const itemsToDisplay = searchQuery
            ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : items;

        for (const item of itemsToDisplay) {
            if (grouped[item.categoryId]) {
                grouped[item.categoryId].push(item);
            } else {
                if (!grouped['varios']) grouped['varios'] = [];
                grouped['varios'].push(item);
            }
        }
        return grouped;
    }, [items, searchQuery]);

    // --- Render Logic ---
    
    const opacityClass = `transition-opacity duration-500 ${isStyled ? 'opacity-100' : 'opacity-0'}`;

    const renderScreen = () => {
        switch (state.view) {
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
                    <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 flex-grow">
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

                                {CATEGORIES.map(category => {
                                    const categoryItems = itemsByCategory[category.id];
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
                                                    className="px-4 sm:px-5 pb-5 border-t border-border dark:border-slate-700"
                                                    style={{ maxHeight: '400px', overflowY: 'auto' }}
                                                >
                                                    <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                                        {categoryItems.map(item => (
                                                            <ItemCard
                                                                key={item.id}
                                                                item={item}
                                                                onQuantityChange={updateItemQuantity}
                                                                onRemove={removeItem}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="bg-white rounded-2xl border  border-border dark:border-border-dark">
                                    <button onClick={() => setIsAddFormExpanded(p => !p)} className="w-full flex justify-between items-center p-4 sm:p-5 text-left" aria-expanded={isAddFormExpanded}>
                                        <h2 className="text-xl font-bold text-[#012E58]">Añadir artículo personalizado</h2>
                                        <div className="bg-muted dark:bg-secondary-dark rounded-full p-1">
                                            <ChevronDownIcon className={`w-5 h-5 text-text-light dark:text-slate-400 transform transition-transform duration-300 ${isAddFormExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    {isAddFormExpanded && (
                                        <div className="px-5 sm:px-6 pb-6 border-t border-border dark:border-slate-700">
                                            <div className="pt-6"><AddItemForm onAddItem={handleAddItem} categories={CATEGORIES} /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <aside className="lg:sticky top-8 self-start space-y-8 w-full">
                                <Summary 
                                    totalVolume={totalVolume} 
                                    totalItems={totalItems} 
                                    selectedItems={selectedItems}
                                    onContinue={() => dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' })}
                                    onClearAll={handleClearAll}
                                    onRemoveItem={handleRemoveSelectedItem}
                                />
                            </aside>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`min-h-screen flex flex-col ${opacityClass}`}>
            <main className="flex-grow flex flex-col">{renderScreen()}</main>
            {state.view === 'calculator' && (
                <footer className="py-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-500 max-w-3xl mx-auto px-4">
                        <strong>Nota importante:</strong> El cálculo del volumen es una estimación para ayudarte en tu planificación. El espacio real requerido puede variar según las dimensiones exactas de tus artículos y la eficiencia con que se empaquen y organicen.
                    </p>
                </footer>
            )}
        </div>
    );
};

export default Calculator;