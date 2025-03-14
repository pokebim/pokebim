import { useState, useEffect } from 'react';
import { CompanyExpense } from '@/lib/companyExpenseService';

interface CompanyExpenseFormProps {
  onSubmit: (data: Partial<CompanyExpense>) => void;
  onCancel: () => void;
  initialData?: CompanyExpense | null;
  preselectedCategory?: string | null;
}

// Tipos de impuestos disponibles
export const TAX_TYPES = [
  'IVA (21%)',
  'IVA Reducido (10%)',
  'IVA Superreducido (4%)',
  'IVA Importación',
  'Aranceles',
  'IRPF',
  'Impuesto de Sociedades',
  'Otros impuestos'
];

const PAYERS = [
  { value: 'edmon', label: 'Edmon' },
  { value: 'albert', label: 'Albert' },
  { value: 'biel', label: 'Biel' },
  { value: 'todos', label: 'Todos' }
];

const CATEGORIES = [
  'Material',
  'Oficina',
  'Web',
  'Marketing',
  'Software',
  'Envíos',
  'Impuestos',
  'Otros'
];

export default function CompanyExpenseForm({ onSubmit, onCancel, initialData, preselectedCategory }: CompanyExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<CompanyExpense>>({
    name: '',
    price: 0,
    link: '',
    paidBy: 'edmon',
    isPaid: false,
    paymentDate: null,
    category: preselectedCategory || 'Otros',
    notes: '',
    taxType: '',
    taxBase: 0,
    taxRate: 0
  });

  // Determinar si estamos añadiendo un impuesto a un gasto existente
  const isAddingTaxToExistingExpense = initialData !== null && preselectedCategory === 'Impuestos';

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        link: initialData.link || '',
        paidBy: initialData.paidBy || 'edmon',
        isPaid: initialData.isPaid || false,
        paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate) : null,
        category: preselectedCategory || initialData.category || 'Otros',
        notes: initialData.notes || '',
        taxType: initialData.taxType || '',
        taxBase: initialData.taxBase || initialData.price || 0, // Si estamos añadiendo impuesto, usar el precio como base imponible por defecto
        taxRate: initialData.taxRate || 0
      });
    } else if (preselectedCategory) {
      // Si no hay datos iniciales pero hay una categoría preseleccionada, actualizar solo la categoría
      setFormData(prev => ({
        ...prev,
        category: preselectedCategory
      }));
    }
  }, [initialData, preselectedCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? parseFloat(value) : value
    }));
  };

  // Actualizar la tasa de impuesto automáticamente según el tipo de impuesto seleccionado
  const handleTaxTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taxType = e.target.value;
    let taxRate = 0;
    
    // Asignar tasa según el tipo de impuesto
    switch (taxType) {
      case 'IVA (21%)':
        taxRate = 21;
        break;
      case 'IVA Reducido (10%)':
        taxRate = 10;
        break;
      case 'IVA Superreducido (4%)':
        taxRate = 4;
        break;
      default:
        taxRate = 0;
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      taxType,
      taxRate
    }));
  };

  // Calcular el impuesto automáticamente
  const calculateTax = () => {
    const base = formData.taxBase || 0;
    const rate = formData.taxRate || 0;
    const calculatedTax = base * (rate / 100);
    
    setFormData(prev => ({
      ...prev,
      price: parseFloat(calculatedTax.toFixed(2))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Si estamos añadiendo un impuesto a un gasto existente, mostrar información del gasto original */}
      {isAddingTaxToExistingExpense && (
        <div className="bg-gray-800 p-4 rounded-md mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Información del gasto original:</h3>
          <p className="text-white"><span className="text-gray-400">Nombre:</span> {initialData?.name}</p>
          <p className="text-white"><span className="text-gray-400">Precio:</span> {initialData?.price?.toFixed(2)} €</p>
          <p className="text-white"><span className="text-gray-400">Categoría:</span> {initialData?.category}</p>
        </div>
      )}

      {/* Solo mostrar el campo de nombre si NO estamos añadiendo un impuesto a un gasto existente */}
      {!isAddingTaxToExistingExpense && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white">
            Nombre del gasto *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            placeholder="Nombre del gasto"
          />
        </div>
      )}

      {/* Solo mostrar el campo de categoría si NO estamos añadiendo un impuesto a un gasto existente */}
      {!isAddingTaxToExistingExpense && (
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mostrar campos específicos para impuestos solo si la categoría es 'Impuestos' */}
      {(formData.category === 'Impuestos' || isAddingTaxToExistingExpense) && (
        <>
          <div>
            <label htmlFor="taxType" className="block text-sm font-medium text-white">
              Tipo de impuesto *
            </label>
            <select
              id="taxType"
              name="taxType"
              required
              value={formData.taxType}
              onChange={handleTaxTypeChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            >
              <option value="">Seleccionar tipo de impuesto</option>
              {TAX_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="taxBase" className="block text-sm font-medium text-white">
              Base imponible (€) *
            </label>
            <input
              type="number"
              id="taxBase"
              name="taxBase"
              required
              step="0.01"
              min="0"
              value={formData.taxBase}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>

          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium text-white">
              Tipo impositivo (%) *
            </label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              required
              step="0.01"
              min="0"
              value={formData.taxRate}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={calculateTax}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              Calcular Impuesto Automáticamente
            </button>
          </div>
        </>
      )}

      {/* Solo mostrar los campos no relacionados con impuestos si NO estamos añadiendo un impuesto a un gasto existente */}
      {!isAddingTaxToExistingExpense && (
        <>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-white">
              Precio (€) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>

          <div>
            <label htmlFor="link" className="block text-sm font-medium text-white">
              Enlace
            </label>
            <input
              type="text"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-white">
              Pagado por
            </label>
            <select
              id="paidBy"
              name="paidBy"
              value={formData.paidBy}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            >
              {PAYERS.map(payer => (
                <option key={payer.value} value={payer.value}>{payer.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPaid"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
            />
            <label htmlFor="isPaid" className="ml-2 block text-sm text-white">
              Ya pagado
            </label>
          </div>

          {formData.isPaid && (
            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-white">
                Fecha de pago
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate ? new Date(formData.paymentDate).toISOString().slice(0, 10) : ''}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              />
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              placeholder="Notas adicionales..."
            />
          </div>
        </>
      )}

      {/* Solo mostrar precio si estamos añadiendo un impuesto a un gasto existente (para mostrar el impuesto calculado) */}
      {isAddingTaxToExistingExpense && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-white">
            Importe del Impuesto (€) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {initialData ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
} 