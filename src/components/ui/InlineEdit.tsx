'use client';

import { useState, useEffect, useRef } from 'react';

interface InlineEditProps {
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  type?: 'text' | 'number';
  className?: string;
}

export default function InlineEdit({
  value: initialValue,
  onSave,
  type = 'text',
  className = '',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
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
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Don't save if value hasn't changed
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(type === 'number' ? Number(value) : value);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving value:', error);
      // Reset to initial value on error
      setValue(initialValue);
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

  // When not editing, show the value with edit button
  if (!isEditing) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="mr-2">{initialValue}</span>
        <button
          onClick={handleEdit}
          className="p-1 text-gray-400 hover:text-blue-400 transition-colors text-xs"
          title="Editar"
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
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => setValue(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24 text-white"
        disabled={isLoading}
      />
      
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