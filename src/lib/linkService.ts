import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

// Interfaz para los grupos de enlaces
export interface LinkGroup {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

// Interfaz para los enlaces individuales
export interface Link {
  id?: string;
  groupId: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  order: number;
  clicks?: number;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Referencias a las colecciones en Firestore
const linkGroupsCollection = collection(db, "linkGroups");
const linksCollection = collection(db, "links");

/**
 * Obtiene todos los grupos de enlaces ordenados por el campo 'order'
 */
export async function getAllLinkGroups(): Promise<LinkGroup[]> {
  try {
    const q = query(linkGroupsCollection, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LinkGroup));
  } catch (error) {
    console.error("Error al obtener grupos de enlaces:", error);
    throw error;
  }
}

/**
 * Obtiene un grupo de enlaces por su ID
 */
export async function getLinkGroupById(id: string): Promise<LinkGroup | null> {
  try {
    const docRef = doc(db, "linkGroups", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as LinkGroup;
  } catch (error) {
    console.error(`Error al obtener grupo de enlaces con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo grupo de enlaces
 */
export async function createLinkGroup(group: Omit<LinkGroup, 'id'>): Promise<string> {
  try {
    // Obtener todos los grupos para determinar el orden del nuevo grupo
    const groups = await getAllLinkGroups();
    const newOrder = groups.length > 0 
      ? Math.max(...groups.map(g => g.order)) + 1 
      : 0;
    
    const groupWithTimestamp = {
      ...group,
      order: newOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(linkGroupsCollection, groupWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear grupo de enlaces:", error);
    throw error;
  }
}

/**
 * Actualiza un grupo de enlaces existente
 */
export async function updateLinkGroup(id: string, group: Partial<LinkGroup>): Promise<void> {
  try {
    const groupRef = doc(db, "linkGroups", id);
    
    // Añadir timestamp de actualización
    const groupWithTimestamp = {
      ...group,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(groupRef, groupWithTimestamp);
  } catch (error) {
    console.error(`Error al actualizar grupo de enlaces ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un grupo de enlaces y todos sus enlaces asociados
 */
export async function deleteLinkGroup(id: string): Promise<void> {
  try {
    // Obtener todos los enlaces del grupo
    const links = await getLinksByGroup(id);
    
    // Usar un batch para eliminar todos los enlaces y el grupo en una sola operación
    const batch = writeBatch(db);
    
    // Añadir operaciones para eliminar cada enlace
    for (const link of links) {
      if (link.id) {
        const linkRef = doc(db, "links", link.id);
        batch.delete(linkRef);
      }
    }
    
    // Añadir operación para eliminar el grupo
    const groupRef = doc(db, "linkGroups", id);
    batch.delete(groupRef);
    
    // Ejecutar todas las operaciones
    await batch.commit();
  } catch (error) {
    console.error(`Error al eliminar grupo de enlaces ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza el orden de los grupos de enlaces
 */
export async function updateLinkGroupsOrder(orderedGroups: {id: string, order: number}[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    orderedGroups.forEach(({id, order}) => {
      const groupRef = doc(db, "linkGroups", id);
      batch.update(groupRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar el orden de los grupos:", error);
    throw error;
  }
}

/**
 * Obtiene todos los enlaces de un grupo específico
 */
export async function getLinksByGroup(groupId: string): Promise<Link[]> {
  try {
    const q = query(
      linksCollection, 
      where("groupId", "==", groupId),
      orderBy("order", "asc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Link));
  } catch (error) {
    console.error(`Error al obtener enlaces del grupo ${groupId}:`, error);
    throw error;
  }
}

/**
 * Obtiene un enlace por su ID
 */
export async function getLinkById(id: string): Promise<Link | null> {
  try {
    const docRef = doc(db, "links", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Link;
  } catch (error) {
    console.error(`Error al obtener enlace con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo enlace
 */
export async function createLink(link: Omit<Link, 'id'>): Promise<string> {
  try {
    // Obtener todos los enlaces del grupo para determinar el orden del nuevo enlace
    const links = await getLinksByGroup(link.groupId);
    const newOrder = links.length > 0 
      ? Math.max(...links.map(l => l.order)) + 1 
      : 0;
    
    const linkWithTimestamp = {
      ...link,
      order: newOrder,
      clicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(linksCollection, linkWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear enlace:", error);
    throw error;
  }
}

/**
 * Actualiza un enlace existente
 */
export async function updateLink(id: string, link: Partial<Link>): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    
    // Añadir timestamp de actualización
    const linkWithTimestamp = {
      ...link,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(linkRef, linkWithTimestamp);
  } catch (error) {
    console.error(`Error al actualizar enlace ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un enlace
 */
export async function deleteLink(id: string): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    await deleteDoc(linkRef);
  } catch (error) {
    console.error(`Error al eliminar enlace ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza el orden de los enlaces dentro de un grupo
 */
export async function updateLinksOrder(orderedLinks: {id: string, order: number}[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    orderedLinks.forEach(({id, order}) => {
      const linkRef = doc(db, "links", id);
      batch.update(linkRef, { 
        order,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar el orden de los enlaces:", error);
    throw error;
  }
}

/**
 * Incrementa el contador de clics para un enlace
 */
export async function incrementLinkClick(id: string): Promise<void> {
  try {
    const linkRef = doc(db, "links", id);
    const linkSnap = await getDoc(linkRef);
    
    if (linkSnap.exists()) {
      const currentClicks = linkSnap.data().clicks || 0;
      await updateDoc(linkRef, { 
        clicks: currentClicks + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(`Error al incrementar clics para el enlace ${id}:`, error);
    throw error;
  }
} 