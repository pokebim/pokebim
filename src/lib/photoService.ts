import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore/lite";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from "firebase/storage";
import { db } from "./firebase";

// Interfaz para los metadatos de foto
export interface Photo {
  id?: string;
  name: string;
  description?: string;
  albumId: string;
  url: string;
  thumbnailUrl?: string;
  storageRef: string;
  createdAt?: any;
  updatedAt?: any;
  size?: number;
  type?: string;
  tags?: string[];
}

// Interfaz para álbumes de fotos
export interface PhotoAlbum {
  id?: string;
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  photoCount?: number;
}

// Referencias a las colecciones en Firestore
const photosCollection = collection(db, "photos");
const albumsCollection = collection(db, "photoAlbums");
const storage = getStorage();

/**
 * Obtiene todos los álbumes
 */
export async function getAllAlbums(): Promise<PhotoAlbum[]> {
  try {
    const q = query(albumsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PhotoAlbum));
  } catch (error) {
    console.error("Error al obtener álbumes:", error);
    throw error;
  }
}

/**
 * Obtiene un álbum por su ID
 */
export async function getAlbumById(id: string): Promise<PhotoAlbum | null> {
  try {
    const docRef = doc(db, "photoAlbums", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as PhotoAlbum;
  } catch (error) {
    console.error(`Error al obtener álbum con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo álbum
 */
export async function createAlbum(album: Omit<PhotoAlbum, 'id'>): Promise<string> {
  try {
    // Añadir timestamps
    const albumWithTimestamps = {
      ...album,
      photoCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(albumsCollection, albumWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear álbum:", error);
    throw error;
  }
}

/**
 * Actualiza un álbum existente
 */
export async function updateAlbum(id: string, album: Partial<PhotoAlbum>): Promise<void> {
  try {
    const albumRef = doc(db, "photoAlbums", id);
    
    // Añadir timestamp de actualización
    const albumWithTimestamp = {
      ...album,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(albumRef, albumWithTimestamp);
  } catch (error) {
    console.error(`Error al actualizar álbum ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un álbum y opcionalmente todas sus fotos
 */
export async function deleteAlbum(id: string, deletePhotos: boolean = false): Promise<void> {
  try {
    // Si se indica, eliminar todas las fotos del álbum
    if (deletePhotos) {
      const photos = await getPhotosByAlbum(id);
      for (const photo of photos) {
        await deletePhoto(photo.id!);
      }
    }
    
    // Eliminar el álbum
    const albumRef = doc(db, "photoAlbums", id);
    await deleteDoc(albumRef);
  } catch (error) {
    console.error(`Error al eliminar álbum ${id}:`, error);
    throw error;
  }
}

/**
 * Sube una foto a Firebase Storage y guarda sus metadatos en Firestore
 */
export async function uploadPhoto(
  file: File, 
  albumId: string,
  metadata: Omit<Photo, 'id' | 'url' | 'storageRef'>
): Promise<Photo> {
  try {
    // Crear una referencia única para el archivo
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `photos/${albumId}/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    // Subir el archivo
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Esperar a que la subida se complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progreso de la subida
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          // Error durante la subida
          console.error('Error uploading file:', error);
          reject(error);
        },
        async () => {
          // Subida completada correctamente
          try {
            // Obtener la URL de descarga
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Crear el documento en Firestore
            const photoData: Omit<Photo, 'id'> = {
              ...metadata,
              albumId,
              url: downloadURL,
              storageRef: storagePath,
              size: file.size,
              type: file.type,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            const docRef = await addDoc(photosCollection, photoData);
            
            // Actualizar contador de fotos en el álbum
            const albumRef = doc(db, "photoAlbums", albumId);
            const albumSnapshot = await getDoc(albumRef);
            
            if (albumSnapshot.exists()) {
              const album = albumSnapshot.data() as PhotoAlbum;
              const photoCount = (album.photoCount || 0) + 1;
              
              // Si es la primera foto y no hay portada, usarla como portada
              if (photoCount === 1 && !album.coverPhotoUrl) {
                await updateDoc(albumRef, { 
                  photoCount,
                  coverPhotoUrl: downloadURL,
                  updatedAt: serverTimestamp()
                });
              } else {
                await updateDoc(albumRef, { 
                  photoCount,
                  updatedAt: serverTimestamp()
                });
              }
            }
            
            resolve({
              id: docRef.id,
              ...photoData,
              createdAt: new Date(), // Para devolver un valor inmediato al cliente
              updatedAt: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error en el proceso de subida:", error);
    throw error;
  }
}

/**
 * Obtiene todas las fotos de un álbum
 */
export async function getPhotosByAlbum(albumId: string): Promise<Photo[]> {
  try {
    const q = query(
      photosCollection, 
      where("albumId", "==", albumId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
  } catch (error) {
    console.error(`Error al obtener fotos del álbum ${albumId}:`, error);
    throw error;
  }
}

/**
 * Obtiene una foto por su ID
 */
export async function getPhotoById(id: string): Promise<Photo | null> {
  try {
    const docRef = doc(db, "photos", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Photo;
  } catch (error) {
    console.error(`Error al obtener foto con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza metadatos de una foto
 */
export async function updatePhoto(id: string, data: Partial<Photo>): Promise<void> {
  try {
    // Asegurarse de que no se actualicen campos críticos
    const { url, storageRef, albumId, createdAt, ...updateData } = data;
    
    const photoRef = doc(db, "photos", id);
    
    // Añadir timestamp de actualización
    await updateDoc(photoRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error al actualizar foto ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina una foto de Storage y sus metadatos de Firestore
 */
export async function deletePhoto(id: string): Promise<void> {
  try {
    // Obtener referencia de Storage
    const photo = await getPhotoById(id);
    
    if (!photo) {
      throw new Error(`Foto con ID ${id} no encontrada`);
    }
    
    // Eliminar archivo de Storage
    const storageReference = ref(storage, photo.storageRef);
    await deleteObject(storageReference);
    
    // Eliminar documento de Firestore
    const photoRef = doc(db, "photos", id);
    await deleteDoc(photoRef);
    
    // Actualizar contador de fotos en el álbum
    if (photo.albumId) {
      const albumRef = doc(db, "photoAlbums", photo.albumId);
      const albumSnapshot = await getDoc(albumRef);
      
      if (albumSnapshot.exists()) {
        const album = albumSnapshot.data() as PhotoAlbum;
        const photoCount = Math.max((album.photoCount || 0) - 1, 0);
        
        // Si era la portada, actualizar con otra foto o quitar
        if (album.coverPhotoUrl === photo.url) {
          // Buscar otra foto para usar como portada
          const photos = await getPhotosByAlbum(photo.albumId);
          const newCoverPhoto = photos.find(p => p.id !== id);
          
          await updateDoc(albumRef, { 
            photoCount,
            coverPhotoUrl: newCoverPhoto ? newCoverPhoto.url : null,
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(albumRef, { 
            photoCount,
            updatedAt: serverTimestamp()
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error al eliminar foto ${id}:`, error);
    throw error;
  }
}

/**
 * Busca fotos por etiquetas o texto
 */
export async function searchPhotos(searchTerm: string): Promise<Photo[]> {
  try {
    // Obtener todas las fotos y filtrar en el cliente
    const snapshot = await getDocs(photosCollection);
    const allPhotos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
    
    // Filtrar por nombre, descripción o etiquetas
    const searchTermLower = searchTerm.toLowerCase();
    return allPhotos.filter(photo => 
      photo.name.toLowerCase().includes(searchTermLower) || 
      (photo.description && photo.description.toLowerCase().includes(searchTermLower)) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(searchTermLower))
    );
  } catch (error) {
    console.error(`Error al buscar fotos con término "${searchTerm}":`, error);
    throw error;
  }
}

/**
 * Establece una foto como portada del álbum
 */
export async function setAlbumCoverPhoto(albumId: string, photoUrl: string): Promise<void> {
  try {
    const albumRef = doc(db, "photoAlbums", albumId);
    await updateDoc(albumRef, {
      coverPhotoUrl: photoUrl,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error al establecer portada para álbum ${albumId}:`, error);
    throw error;
  }
} 