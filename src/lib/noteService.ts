'use client';

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  where 
} from 'firebase/firestore';

export interface Note {
  id?: string;
  title: string;
  content: string;
  color: string;
  archived: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Acceder a la colección notes solo cuando estamos en el cliente
const getNotesCollection = () => {
  if (typeof window === 'undefined') {
    // Estamos en el servidor, devolver un objeto vacío para no causar errores
    return null;
  }
  return collection(db, 'notes');
};

// Obtener todas las notas
export async function getAllNotes(includeArchived = false) {
  try {
    const notesCollection = getNotesCollection();
    if (!notesCollection) {
      return []; // Si estamos en el servidor, devolvemos un array vacío
    }
    
    let q;
    
    if (!includeArchived) {
      q = query(
        notesCollection,
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        notesCollection,
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Note[];
  } catch (error) {
    console.error('Error al obtener las notas:', error);
    return []; // En caso de error, devolvemos un array vacío
  }
}

// Añadir una nueva nota
export async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const notesCollection = getNotesCollection();
    if (!notesCollection) {
      throw new Error('No se puede acceder a la colección de notas en el servidor');
    }
    
    const newNote = {
      ...note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(notesCollection, newNote);
    return {
      id: docRef.id,
      ...newNote
    };
  } catch (error) {
    console.error('Error al añadir la nota:', error);
    throw error;
  }
}

// Actualizar una nota existente
export async function updateNote(id: string, noteData: Partial<Note>) {
  try {
    if (typeof window === 'undefined') {
      throw new Error('No se puede actualizar la nota en el servidor');
    }
    
    const noteRef = doc(db, 'notes', id);
    const updateData = {
      ...noteData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(noteRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error(`Error al actualizar la nota ${id}:`, error);
    throw error;
  }
}

// Archivar/desarchivar una nota
export async function toggleArchiveNote(id: string, archived: boolean) {
  return updateNote(id, { archived });
}

// Eliminar una nota
export async function deleteNote(id: string) {
  try {
    if (typeof window === 'undefined') {
      throw new Error('No se puede eliminar la nota en el servidor');
    }
    
    const noteRef = doc(db, 'notes', id);
    await deleteDoc(noteRef);
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar la nota ${id}:`, error);
    throw error;
  }
} 