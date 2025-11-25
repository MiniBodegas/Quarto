import { useState } from 'react';
import { CubeIcon } from './icons';
import {Input, Select, Button} from '../index'

const AddItemForm = ({ onAddItem, categories }) => {
    const [name, setName] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [depth, setDepth] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        const numWidth = parseFloat(width.replace(',', '.'));
        const numHeight = parseFloat(height.replace(',', '.'));
        const numDepth = parseFloat(depth.replace(',', '.'));
        const numQuantity = parseInt(quantity, 10);

        if (name && categoryId && numWidth > 0 && numHeight > 0 && numDepth > 0 && numQuantity > 0) {
            onAddItem({
                name,
                width: numWidth,
                height: numHeight,
                depth: numDepth,
                quantity: numQuantity,
                icon: CubeIcon,
                categoryId,
            });
            setName('');
            setWidth('');
            setHeight('');
            setDepth('');
            setQuantity('1');
            setCategoryId(categories[0]?.id || '');
        }
    };
    
    const handleDimensionInput = (value, setter) => {
        const validDecimal = /^[0-9]*[.,]?[0-9]*$/;
        if (value === "" || validDecimal.test(value)) {
            setter(value);
        }
    };

    const handleIntegerInput = (value, setter) => {
        const validInteger = /^[0-9]*$/;
        if (value === "" || validInteger.test(value)) {
            setter(value);
        }
    };

    const inputClasses = "!px-3 !py-2 !bg-muted dark:!bg-muted-dark !border-border dark:!border-border-dark !rounded-lg";
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                id="itemName"
                label="Nombre del artículo"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Mi Estantería"
                required
                className={inputClasses}
            />
            
            <Select
                id="itemCategory"
                label="Categoría"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                className={inputClasses}
            >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </Select>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input
                    id="itemWidth"
                    label="Ancho (m)"
                    type="text"
                    inputMode="decimal"
                    value={width}
                    onChange={e => handleDimensionInput(e.target.value, setWidth)}
                    placeholder="0.8"
                    required
                    className={inputClasses}
                />
                 <Input
                    id="itemHeight"
                    label="Alto (m)"
                    type="text"
                    inputMode="decimal"
                    value={height}
                    onChange={e => handleDimensionInput(e.target.value, setHeight)}
                    placeholder="1.5"
                    required
                    className={inputClasses}
                />
                 <Input
                    id="itemDepth"
                    label="Fondo (m)"
                    type="text"
                    inputMode="decimal"
                    value={depth}
                    onChange={e => handleDimensionInput(e.target.value, setDepth)}
                    placeholder="0.4"
                    required
                    className={inputClasses}
                />
                <Input
                    id="itemQuantity"
                    label="Cantidad"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={e => handleIntegerInput(e.target.value, setQuantity)}
                    placeholder="1"
                    required
                    className={inputClasses}
                />
            </div>
            
            <Button type="submit" className="!mt-6">
                Añadir artículo
            </Button>
        </form>
    );
};

export default AddItemForm;