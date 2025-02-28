import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// Interfaz para la tarea
export interface Task {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  createdAt: string;
}

// Obtener todas las tareas
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const tasksCol = collection(db, "tasks");
    const q = query(tasksCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Task, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw error;
  }
};

// Añadir una nueva tarea
export const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  try {
    // Asegurarse de que la fecha de creación esté establecida
    const taskToSave = {
      ...task,
      createdAt: task.createdAt || new Date().toISOString()
    };
    
    const tasksCol = collection(db, "tasks");
    const docRef = await addDoc(tasksCol, taskToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// Actualizar una tarea existente
export const updateTask = async (id: string, task: Partial<Task>): Promise<void> => {
  try {
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, task);
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw error;
  }
};

// Eliminar una tarea
export const deleteTask = async (id: string): Promise<void> => {
  try {
    const taskRef = doc(db, "tasks", id);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
}; 