'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    console.log('Iniciando subida de archivo:', { fileName: file.name, path });
    
    // Crear una referencia al archivo en Firebase Storage
    const storageRef = ref(storage, path);
    console.log('Referencia de almacenamiento creada');
    
    // Convertir el archivo a un ArrayBuffer
    console.log('Convirtiendo archivo a ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('Archivo convertido a ArrayBuffer');
    
    // Subir el archivo como un Uint8Array
    console.log('Subiendo archivo a Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, new Uint8Array(arrayBuffer));
    console.log('Archivo subido exitosamente');
    
    // Obtener la URL de descarga
    console.log('Obteniendo URL de descarga...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('URL de descarga obtenida:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error detallado al subir archivo:', {
      error,
      fileName: file.name,
      path,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido'
    });
    throw error;
  }
}

export async function getFileURL(path: string): Promise<string> {
  try {
    console.log('Obteniendo URL para:', path);
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    console.log('URL obtenida:', url);
    return url;
  } catch (error) {
    console.error('Error al obtener URL del archivo:', {
      error,
      path,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido'
    });
    throw error;
  }
} 