'use client';

import React, { useState } from 'react';
import { Supplier } from '@/lib/supplierService';

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function SupplierForm({ supplier, onSubmit, onCancel }: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name || '');
  const [origin, setOrigin] = useState(supplier?.origin || '');
  const [country, setCountry] = useState(supplier?.country || '');
  const [contactName, setContactName] = useState(supplier?.contactName || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [website, setWebsite] = useState(supplier?.website || '');
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [region, setRegion] = useState(supplier?.region || 'other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo incluir el ID si estamos editando un proveedor existente
    const supplierData = supplier?.id 
      ? {
          id: supplier.id,
          name,
          origin,
          country,
          contactName,
          email,
          phone,
          website,
          notes,
          region,
          isFavorite: supplier.isFavorite || false,
          hasPendingOrder: supplier.hasPendingOrder || false
        }
      : {
          name,
          origin,
          country,
          contactName,
          email,
          phone,
          website,
          notes,
          region,
          isFavorite: false,
          hasPendingOrder: false
        };

    onSubmit(supplierData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Origen
        </label>
        <input
          type="text"
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          País
        </label>
        <input
          type="text"
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Nombre de Contacto
        </label>
        <input
          type="text"
          id="contactName"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Sitio Web
        </label>
        <input
          type="url"
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Región
        </label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="asian">Asia</option>
          <option value="european">Europa</option>
          <option value="other">Otra</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {supplier ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
} 