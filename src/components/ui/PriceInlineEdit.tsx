'use client';

import { useState, useEffect, useRef } from 'react';
import { updatePrice } from '@/lib/priceService';
import { formatCurrency, type Currency } from '@/lib/currencyConverter';

interface PriceInlineEditProps {
  id: string;
  price: number;
  currency: Currency;
  onUpdate?: (newPrice: number) => void;
  className?: string;
  directUpdate?: boolean;
}

export default function PriceInlineEdit({
  id,
  price: initialPrice,
  currency,
  onUpdate,
  className = '',
  directUpdate = true,
}: PriceInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(initialPrice);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setPrice(initialPrice);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Don't save if price hasn't changed
    if (price === initialPrice) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      // Actualizar en Firebase solo si directUpdate es true
      if (directUpdate) {
        await updatePrice(id, { price });
      }
      
      // Siempre llamar a onUpdate si está definido
      if (onUpdate) onUpdate(price);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving price:', error);
      // Reset to initial value on error
      setPrice(initialPrice);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // When not editing, show the formatted price with edit button
  if (!isEditing) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="mr-2">{formatCurrency(initialPrice, currency)}</span>
        <button
          onClick={handleEdit}
          className="p-1 text-gray-400 hover:text-blue-400 transition-colors text-xs"
          title="Editar precio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    );
  }

  // When editing, show input field with save/cancel buttons
  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <div className="relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
          {currency === 'EUR' ? '€' : 
           currency === 'USD' ? '$' : 
           currency === 'GBP' ? '£' : 
           currency === 'JPY' ? '¥' : 
           currency === 'CNY' ? '¥' : 
           currency === 'KRW' ? '₩' : ''}
        </span>
        <input
          ref={inputRef}
          type="number"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 pl-6 text-sm w-24 text-white"
          disabled={isLoading}
          min="0"
          step="0.01"
        />
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 text-green-500 hover:text-green-400 transition-colors"
          title="Guardar"
        >
          {isLoading ? (
            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-red-500 hover:text-red-400 transition-colors"
          title="Cancelar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 