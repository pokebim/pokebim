import { useState, useEffect } from 'react';

interface Supplier {
  id?: string;
  name?: string;
  contact?: string;
  website?: string;
  origin?: string;
  region?: string;
  notes?: string;
  shippingCost?: number;
}

interface SupplierFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function SupplierForm({ onSubmit, onCancel, initialData }: SupplierFormProps) {
  // Define default form data - all fields must have default values
  const defaultFormData = {
    name: '',
    website: '',
    country: '',
    email: '',
    phone: '',
    contactName: '',
    origin: '',
    region: 'asian',
    notes: '',
    shippingCost: 0
  };
  
  // Initialize with default values - this ensures no undefined values
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When initialData changes, merge with default data
  useEffect(() => {
    if (initialData) {
      console.log('FORM: Initializing with data:', initialData);
      
      // Create a clean version with defaults for any missing fields
      const cleanData = {
        ...defaultFormData,  // Start with all defaults
        ...Object.fromEntries(  // Only include defined values from initialData
          Object.entries(initialData).filter(([_, v]) => v !== undefined)
        ),
        // Ensure region is always valid
        region: initialData.region || defaultFormData.region
      };
      
      console.log('FORM: Clean initialization data:', cleanData);
      setFormData(cleanData);
    } else {
      // Reset to defaults if no initialData
      console.log('FORM: Resetting to defaults');
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    console.log(`FORM: Field ${name} changed to:`, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Ensure all fields are defined (not undefined)
      const dataToSubmit = {
        ...formData,
        region: formData.region || 'asian', // Fallback to asian if somehow region is empty
      };
      
      console.log('FORM: Submitting data:', dataToSubmit);
      onSubmit(dataToSubmit);
    } catch (err) {
      setError('Ocurrió un error al guardar el proveedor. Por favor, inténtalo de nuevo.');
      console.error('FORM: Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-white">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="region" className="block text-sm font-bold text-white">
            Región
          </label>
          <select
            id="region"
            name="region"
            value={formData.region || 'asian'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          >
            <option value="asian" className="text-white">Asiático (Japonés/Chino/Coreano)</option>
            <option value="european" className="text-white">Europeo</option>
            <option value="other" className="text-white">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="origin" className="block text-sm font-bold text-white">
            Origen
          </label>
          <select
            id="origin"
            name="origin"
            value={formData.origin || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          >
            <option value="" className="text-gray-400">Selecciona un origen</option>
            <option value="Alibaba" className="text-white">Alibaba</option>
            <option value="Instagram" className="text-white">Instagram</option>
            <option value="Facebook" className="text-white">Facebook</option>
            <option value="Website" className="text-white">Sitio Web</option>
            <option value="Direct Contact" className="text-white">Contacto Directo</option>
            <option value="Other" className="text-white">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-white">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-white">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-bold text-white">
          Sitio Web
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
          placeholder="https://ejemplo.com"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-bold text-white">
          Nombre de Contacto
        </label>
        <input
          type="text"
          id="contactName"
          name="contactName"
          value={formData.contactName || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-bold text-white">
          País
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="shippingCost" className="block text-sm font-bold text-white">
          Precio de envío aproximado (EUR)
        </label>
        <input
          type="number"
          id="shippingCost"
          name="shippingCost"
          value={formData.shippingCost || 0}
          onChange={handleChange}
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-bold text-white">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
          placeholder="Información adicional sobre el proveedor"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
} 