'use client';

import React, { useState, useEffect } from 'react';
import { getAllNotes, addNote, updateNote, deleteNote, toggleArchiveNote, Note } from '@/lib/noteService';
import { PencilIcon, TrashIcon, ArchiveBoxIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

// Colores disponibles para las notas
const noteColors = [
  { name: 'Amarillo', value: 'bg-yellow-100' },
  { name: 'Azul', value: 'bg-blue-100' },
  { name: 'Verde', value: 'bg-green-100' },
  { name: 'Rosa', value: 'bg-pink-100' },
  { name: 'Púrpura', value: 'bg-purple-100' }
];

export default function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: noteColors[0].value,
    archived: false
  });

  // Cargar notas
  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const notesData = await getAllNotes(false);
      setNotes(notesData);
    } catch (error) {
      console.error('Error al cargar notas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de color
  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      color: noteColors[0].value,
      archived: false
    });
    setEditingNote(null);
  };

  // Mostrar formulario para nueva nota
  const handleNewNote = () => {
    resetForm();
    setShowForm(true);
  };

  // Editar nota existente
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color,
      archived: note.archived
    });
    setShowForm(true);
  };

  // Guardar nota (crear o actualizar)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingNote && editingNote.id) {
        // Actualizar nota existente
        await updateNote(editingNote.id, formData);
      } else {
        // Crear nueva nota
        await addNote(formData);
      }
      
      // Recargar notas y cerrar formulario
      await loadNotes();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error al guardar nota:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar nota
  const handleDeleteNote = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta nota?')) {
      setIsLoading(true);
      try {
        await deleteNote(id);
        await loadNotes();
      } catch (error) {
        console.error('Error al eliminar nota:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Archivar nota
  const handleArchiveNote = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await toggleArchiveNote(id, !currentStatus);
      await loadNotes();
    } catch (error) {
      console.error('Error al archivar nota:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Si el widget está cerrado, mostrar solo el botón de abrir
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full p-3 text-gray-700 hover:bg-gray-100"
        title="Abrir notas"
      >
        <PencilIcon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${
        isExpanded ? 'w-96 h-[500px]' : 'w-72 h-[300px]'
      }`}
    >
      {/* Cabecera del widget */}
      <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium">Notas</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-indigo-200"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-indigo-200"
            title="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-3 overflow-y-auto h-[calc(100%-56px)]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : showForm ? (
          /* Formulario para crear/editar nota */
          <form onSubmit={handleSaveNote} className="space-y-3">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Título de la nota"
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Contenido
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={isExpanded ? 10 : 4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Escribe aquí tu nota..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <div className="mt-1 flex space-x-2">
                {noteColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorChange(color.value)}
                    className={`w-6 h-6 rounded-full ${color.value} ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? 'Guardando...' : editingNote ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : notes.length > 0 ? (
          /* Lista de notas */
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note.id}
                className={`p-3 rounded-md shadow-sm ${note.color} relative group`}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="text-gray-600 hover:text-indigo-600"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => note.id && handleArchiveNote(note.id, !!note.archived)}
                    className="text-gray-600 hover:text-amber-600"
                    title={note.archived ? 'Desarchivar' : 'Archivar'}
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => note.id && handleDeleteNote(note.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <h4 className="font-medium text-gray-900">{note.title}</h4>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-3">No hay notas creadas todavía</p>
          </div>
        )}
      </div>

      {/* Botón flotante para añadir nota */}
      {!showForm && (
        <button
          onClick={handleNewNote}
          className="absolute bottom-4 right-4 bg-indigo-600 text-white rounded-full p-2 shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          title="Nueva nota"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
} 