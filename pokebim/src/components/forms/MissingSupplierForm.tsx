import { useState, useEffect } from 'react';

interface MissingSupplier {
  id?: string;
  name: string;
  email: string;
  emailSent: boolean;
  emailDate?: string;
  responded: boolean;
  info: string;
}

interface MissingSupplierFormProps {
  onSubmit: (data: MissingSupplier) => void;
  onCancel: () => void;
  initialData?: MissingSupplier | null;
}

export default function MissingSupplierForm({ onSubmit, onCancel, initialData }: MissingSupplierFormProps) {
  const [formData, setFormData] = useState<MissingSupplier>({
    name: '',
    email: '',
    emailSent: false,
    emailDate: '',
    responded: false,
    info: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      onSubmit(formData);
    } catch (err) {
      setError('Ocurrió un error al guardar el proveedor. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar formulario:', err);
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
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-white">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 placeholder-gray-400 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emailSent"
            name="emailSent"
            checked={formData.emailSent}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded bg-gray-800"
          />
          <label htmlFor="emailSent" className="ml-2 block text-sm text-white">
            Email Enviado
          </label>
        </div>

        {formData.emailSent && (
          <div>
            <label htmlFor="emailDate" className="block text-sm font-bold text-white">
              Fecha de Envío
            </label>
            <input
              type="date"
              id="emailDate"
              name="emailDate"
              value={formData.emailDate || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            />
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="responded"
          name="responded"
          checked={formData.responded}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded bg-gray-800"
        />
        <label htmlFor="responded" className="ml-2 block text-sm text-white">
          Ha Respondido
        </label>
      </div>

      <div>
        <label htmlFor="info" className="block text-sm font-bold text-white">
          Información Adicional
        </label>
        <textarea
          id="info"
          name="info"
          value={formData.info}
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