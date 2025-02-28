import { useState, useEffect } from 'react';
import { CompanyExpense } from '@/lib/companyExpenseService';

interface CompanyExpenseFormProps {
  onSubmit: (data: Partial<CompanyExpense>) => void;
  onCancel: () => void;
  initialData?: CompanyExpense | null;
}

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
  'Otros'
];

export default function CompanyExpenseForm({ onSubmit, onCancel, initialData }: CompanyExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<CompanyExpense>>({
    name: '',
    price: 0,
    link: '',
    paidBy: 'edmon',
    isPaid: false,
    paymentDate: null,
    category: 'Otros',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        link: initialData.link || '',
        paidBy: initialData.paidBy || 'edmon',
        isPaid: initialData.isPaid || false,
        paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate) : null,
        category: initialData.category || 'Otros',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre del gasto */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Nombre del gasto/producto *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="Cajas de cartón, hosting web, etc."
        />
      </div>

      {/* Precio */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-white">
          Precio (€) *
        </label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="0.00"
        />
      </div>

      {/* Link */}
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-white">
          Enlace del producto
        </label>
        <input
          type="url"
          id="link"
          name="link"
          value={formData.link}
          onChange={handleChange}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="https://ejemplo.com/producto"
        />
      </div>

      {/* Categoría */}
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

      {/* Pagado por */}
      <div>
        <label htmlFor="paidBy" className="block text-sm font-medium text-white">
          Pagado por *
        </label>
        <select
          id="paidBy"
          name="paidBy"
          value={formData.paidBy}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
        >
          {PAYERS.map(payer => (
            <option key={payer.value} value={payer.value}>{payer.label}</option>
          ))}
        </select>
      </div>

      {/* Estado de pago */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPaid"
          name="isPaid"
          checked={formData.isPaid}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded bg-gray-800"
        />
        <label htmlFor="isPaid" className="ml-2 block text-sm text-white">
          Ya está pagado
        </label>
      </div>

      {/* Fecha de pago (solo visible si isPaid es true) */}
      {formData.isPaid && (
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-white">
            Fecha de pago
          </label>
          <input
            type="date"
            id="paymentDate"
            name="paymentDate"
            value={formData.paymentDate ? new Date(formData.paymentDate).toISOString().split('T')[0] : ''}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
      )}

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-white">
          Notas adicionales
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="Información adicional sobre este gasto..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {initialData ? 'Actualizar' : 'Añadir'} Gasto
        </button>
      </div>
    </form>
  );
} 