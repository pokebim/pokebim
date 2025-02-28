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
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Interfaz para los posts de la wiki
export interface WikiPost {
  id?: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
  published?: boolean;
  imageUrl?: string;
}

// Referencia a la colección de posts en Firestore
const wikiCollection = collection(db, "wiki");

/**
 * Obtiene todos los posts de la wiki
 * @param onlyPublished Si es true, sólo devuelve posts publicados
 */
export async function getAllWikiPosts(onlyPublished: boolean = false): Promise<WikiPost[]> {
  try {
    let q = query(wikiCollection, orderBy("createdAt", "desc"));
    
    if (onlyPublished) {
      q = query(wikiCollection, where("published", "==", true), orderBy("createdAt", "desc"));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WikiPost));
  } catch (error) {
    console.error("Error al obtener posts de wiki:", error);
    throw error;
  }
}

/**
 * Obtiene un post específico por su ID
 * @param id ID del post a obtener
 */
export async function getWikiPostById(id: string): Promise<WikiPost | null> {
  try {
    const docRef = doc(db, "wiki", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as WikiPost;
  } catch (error) {
    console.error(`Error al obtener post con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Añade un nuevo post a la wiki
 * @param post Datos del post a añadir
 * @returns ID del post creado
 */
export async function addWikiPost(post: Omit<WikiPost, 'id'>): Promise<string> {
  try {
    // Añadir timestamps
    const postWithTimestamps = {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(wikiCollection, postWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error("Error al añadir post a la wiki:", error);
    throw error;
  }
}

/**
 * Actualiza un post existente
 * @param id ID del post a actualizar
 * @param post Datos actualizados
 */
export async function updateWikiPost(id: string, post: Partial<WikiPost>): Promise<void> {
  try {
    const postRef = doc(db, "wiki", id);
    
    // Añadir timestamp de actualización
    const postWithTimestamp = {
      ...post,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(postRef, postWithTimestamp);
  } catch (error) {
    console.error(`Error al actualizar post ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un post de la wiki
 * @param id ID del post a eliminar
 */
export async function deleteWikiPost(id: string): Promise<void> {
  try {
    const postRef = doc(db, "wiki", id);
    await deleteDoc(postRef);
  } catch (error) {
    console.error(`Error al eliminar post ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene posts por categoría
 * @param category Categoría a filtrar
 */
export async function getWikiPostsByCategory(category: string): Promise<WikiPost[]> {
  try {
    const q = query(
      wikiCollection, 
      where("category", "==", category),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WikiPost));
  } catch (error) {
    console.error(`Error al obtener posts por categoría ${category}:`, error);
    throw error;
  }
}

/**
 * Busca posts por término
 * @param searchTerm Término a buscar en título y contenido
 */
export async function searchWikiPosts(searchTerm: string): Promise<WikiPost[]> {
  try {
    // Firebase no soporta búsqueda de texto completo directamente,
    // así que obtenemos todos los posts publicados y filtramos en el cliente
    const allPosts = await getAllWikiPosts(true);
    
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(lowercaseSearchTerm) || 
      post.content.toLowerCase().includes(lowercaseSearchTerm) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearchTerm))
    );
  } catch (error) {
    console.error(`Error al buscar posts con término "${searchTerm}":`, error);
    throw error;
  }
} 