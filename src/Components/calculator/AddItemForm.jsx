import { useState, useMemo } from 'react';
import { CubeIcon } from './icons';
import { Input, Select, Button } from '../index';

const AddItemForm = ({ onAddItem, categories }) => {
  const [name, setName] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  const handleDimensionInput = (value, setter) => {
    const validDecimal = /^[0-9]*[.,]?[0-9]*$/;
    if (value === '' || validDecimal.test(value)) {
      setter(value);
    }
  };

  const handleIntegerInput = (value, setter) => {
    const validInteger = /^[0-9]*$/;
    if (value === '' || validInteger.test(value)) {
      setter(value);
    }
  };

  const parseDim = (v) => {
    if (!v) return NaN;
    return parseFloat(v.replace(',', '.'));
  };

  const numWidth = parseDim(width);
  const numHeight = parseDim(height);
  const numDepth = parseDim(depth);
  const numQuantity = parseInt(quantity || '0', 10);

  const previewVolume = useMemo(() => {
    if (
      !name ||
      !categoryId ||
      Number.isNaN(numWidth) ||
      Number.isNaN(numHeight) ||
      Number.isNaN(numDepth) ||
      numWidth <= 0 ||
      numHeight <= 0 ||
      numDepth <= 0
    ) {
      return null;
    }
    const v = numWidth * numHeight * numDepth;
    return Number.isNaN(v) ? null : v.toFixed(2);
  }, [name, categoryId, numWidth, numHeight, numDepth]);

  const isValid =
    name.trim() &&
    categoryId &&
    !Number.isNaN(numWidth) &&
    !Number.isNaN(numHeight) &&
    !Number.isNaN(numDepth) &&
    numWidth > 0 &&
    numHeight > 0 &&
    numDepth > 0 &&
    !Number.isNaN(numQuantity) &&
    numQuantity > 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) return;

    onAddItem({
      name: name.trim(),
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
  };

  const inputClasses =
    '!px-3 !py-2 !bg-white dark:!bg-transparent !border-border dark:!border-border-dark !rounded-lg !text-[#012E58]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <Input
          id="itemName"
          label="Nombre del artículo"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Estantería metálica"
          required
          className={inputClasses}
        />

        <Select
          id="itemCategory"
          label="Categoría"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className={inputClasses}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-transparent px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#012E58]">
              Dimensiones
            </p>
            <p className="text-[11px] text-[#012E58]/80">
              Usa metros. Ej: 1.2 &nbsp;=&nbsp; 120 cm
            </p>
          </div>

          {previewVolume && (
            <span className="inline-flex items-center rounded-full bg-[#012E58]/5 px-3 py-1 text-[11px] font-medium text-[#012E58]">
              Volumen estimado: {previewVolume} m³
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <Input
            id="itemWidth"
            label="Ancho (m)"
            type="text"
            inputMode="decimal"
            value={width}
            onChange={(e) => handleDimensionInput(e.target.value, setWidth)}
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
            onChange={(e) => handleDimensionInput(e.target.value, setHeight)}
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
            onChange={(e) => handleDimensionInput(e.target.value, setDepth)}
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
            onChange={(e) => handleIntegerInput(e.target.value, setQuantity)}
            placeholder="1"
            required
            className={inputClasses}
          />
        </div>
      </div>

      <Button type="submit" disabled={!isValid} className="!mt-4 w-full">
        Añadir artículo
      </Button>
    </form>
  );
};

export default AddItemForm;
