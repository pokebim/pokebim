'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { 
  Task, 
  getAllTasks, 
  addTask, 
  updateTask, 
  deleteTask 
} from '@/lib/taskService';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';

// Define column colors statically for Tailwind
const columnStyles = {
  pending: {
    border: 'border-yellow-700',
    title: 'text-yellow-400',
    badge: 'bg-yellow-800 text-yellow-200',
    button: 'border-yellow-600 text-yellow-400 hover:bg-yellow-900'
  },
  'in-progress': {
    border: 'border-blue-700',
    title: 'text-blue-400',
    badge: 'bg-blue-800 text-blue-200',
    button: 'border-blue-600 text-blue-400 hover:bg-blue-900'
  },
  completed: {
    border: 'border-green-700',
    title: 'text-green-400',
    badge: 'bg-green-800 text-green-200',
    button: 'border-green-600 text-green-400 hover:bg-green-900'
  }
};

interface Column {
  id: string;
  title: string;
}

const ITEM_TYPE = 'TASK';

// Task component with drag functionality
const TaskCard = ({ task, onEdit, onDelete, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`task-card p-3 mb-2 rounded-md shadow-md bg-gray-800 cursor-move ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="text-white">{task.title}</div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {new Date(task.createdAt).toLocaleDateString()}
        </div>
        <div className="space-x-1">
          <button
            onClick={() => onEdit(task)}
            className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600"
          >
            Eliminar
          </button>
          <div className="dropdown inline-block relative">
            <button className="px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600">
              Mover
            </button>
            <div className="dropdown-menu hidden absolute right-0 mt-1 z-10 bg-gray-800 rounded shadow-lg">
              <div className="py-1">
                {['pending', 'in-progress', 'completed'].filter(col => col !== task.status).map(col => (
                  <button
                    key={col}
                    onClick={() => onMove(task.id, col)}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    {col === 'pending' 
                      ? 'Pendiente' 
                      : col === 'in-progress' 
                        ? 'En Progreso' 
                        : 'Completado'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {task.description && (
        <div className="mt-2 text-xs text-gray-400">
          {task.description}
        </div>
      )}
    </div>
  );
};

// Column component with drop functionality
const TaskColumn = ({ column, tasks, onAddTask, onEditTask, onDeleteTask, onMoveTask }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => {
      if (item.status !== column.id) {
        onMoveTask(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  const columnStyle = columnStyles[column.id];

  return (
    <div
      ref={drop}
      className={`task-column flex-1 p-4 rounded-lg ${
        isOver ? 'bg-gray-700' : 'bg-gray-900'
      } transition-all duration-200`}
    >
      <div className={`flex items-center justify-between mb-4 pb-2 ${columnStyle.border}`}>
        <h3 className={`font-semibold ${columnStyle.title} text-lg`}>{column.title}</h3>
        <span className={`px-2 py-1 rounded ${columnStyle.badge} text-xs font-bold`}>
          {tasks.length}
        </span>
      </div>
      <div>
        {tasks.map((task) => (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => handleViewDetail(task)}
              className="px-2 py-1 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={() => handleEditTask(task)}
              className="px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => handleDeleteTask(task.id || '')}
              className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => onAddTask(column.id)}
        className={`mt-3 w-full py-2 rounded-md border border-dashed ${columnStyle.button} transition-colors`}
      >
        + Añadir Tarea
      </button>
    </div>
  );
};

// Form for adding/editing tasks
const TaskForm = ({ onSubmit, onCancel, initialTask = null }) => {
  const [title, setTitle] = useState(initialTask ? initialTask.title : '');
  const [description, setDescription] = useState(initialTask ? initialTask.description || '' : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({
      ...(initialTask || {}),
      title,
      description
    });
    
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-sm font-bold text-white mb-2">
          Título de la tarea
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          required
        />
      </div>
      
      <div>
        <label htmlFor="task-description" className="block text-sm font-bold text-white mb-2">
          Descripción (opcional)
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          rows={4}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
        >
          {initialTask ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Nuevos estados para vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Define columns
  const columns: Column[] = [
    { id: 'pending', title: 'Pendientes' },
    { id: 'in-progress', title: 'En Progreso' },
    { id: 'completed', title: 'Completados' }
  ];

  // Fetch tasks from Firebase
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const firebaseTasks = await getAllTasks();
      console.log('FIREBASE: Loaded tasks:', firebaseTasks);
      setTasks(firebaseTasks);
      setLoading(false);
    } catch (err) {
      console.error('Error loading tasks from Firebase:', err);
      setLoading(false);
      showNotification('Error al cargar las tareas', 'error');
    }
  }, []);

  // Initialize tasks from Firebase
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle opening the modal to add a task
  const handleAddTask = (columnId: string) => {
    setActiveColumn(columnId);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Handle opening the modal to edit a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
    
    try {
      await deleteTask(taskId);
      console.log(`FIREBASE: Deleted task ${taskId}`);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      showNotification('Tarea eliminada correctamente');
    } catch (err) {
      console.error('Error deleting task:', err);
      showNotification('Error al eliminar la tarea', 'error');
    }
  };

  // Handle moving a task to another column
  const handleMoveTask = async (taskId: string, targetStatus: string) => {
    // Find the task
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    
    try {
      // Update the task in Firebase
      await updateTask(taskId, { status: targetStatus });
      console.log(`FIREBASE: Moved task ${taskId} to ${targetStatus}`);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: targetStatus } : task
        )
      );
      
      showNotification('Tarea movida correctamente');
    } catch (err) {
      console.error('Error moving task:', err);
      showNotification('Error al mover la tarea', 'error');
    }
  };

  // Handle submitting the task form
  const handleSubmitTask = async (taskData: any) => {
    try {
      if (editingTask && editingTask.id) {
        // Update existing task
        await updateTask(editingTask.id, {
          title: taskData.title,
          description: taskData.description
        });
        console.log(`FIREBASE: Updated task ${editingTask.id}`);
        
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === editingTask.id 
              ? { ...task, title: taskData.title, description: taskData.description } 
              : task
          )
        );
        
        showNotification('Tarea actualizada correctamente');
      } else {
        // Create new task
        const newTask = {
          title: taskData.title,
          description: taskData.description,
          status: activeColumn || 'pending',
          createdAt: new Date().toISOString()
        };
        
        const newTaskId = await addTask(newTask);
        console.log(`FIREBASE: Added new task with ID ${newTaskId}`);
        
        // Update local state
        setTasks(prevTasks => [
          ...prevTasks,
          { ...newTask, id: newTaskId }
        ]);
        
        showNotification('Tarea añadida correctamente');
      }
      
      // Close modal and reset state
      setIsModalOpen(false);
      setEditingTask(null);
      setActiveColumn(null);
    } catch (err) {
      console.error('Error submitting task:', err);
      showNotification('Error al guardar la tarea', 'error');
    }
  };

  const showNotification = (message: string, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Filter tasks by column
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId);
  };

  // Nueva función para ver detalles
  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailViewOpen(true);
  };

  return (
    <MainLayout>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-800 text-white border-l-4 border-green-500' : 'bg-red-800 text-white border-l-4 border-red-500'
        } transition-opacity duration-300 ease-in-out font-medium`}>
          {notification.message}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setActiveColumn(null);
        }}
        title={editingTask ? "Editar tarea" : "Añadir nueva tarea"}
      >
        <TaskForm
          onSubmit={handleSubmitTask}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTask(null);
            setActiveColumn(null);
          }}
          initialTask={editingTask}
        />
      </Modal>

      {/* Vista detallada de la tarea */}
      {selectedTask && (
        <DetailView
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle de Tarea: ${selectedTask.title}`}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setDetailViewOpen(false);
                  handleEditTask(selectedTask);
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDetailViewOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </>
          }
        >
          <DetailSection title="Información de la Tarea">
            <DetailGrid>
              <DetailField 
                label="Título" 
                value={<span className="font-semibold">{selectedTask.title}</span>} 
              />
              <DetailField 
                label="Estado" 
                value={
                  <DetailBadge 
                    color={
                      selectedTask.status === 'completed' ? 'green' : 
                      selectedTask.status === 'in-progress' ? 'blue' : 
                      'yellow'
                    }
                  >
                    {selectedTask.status === 'completed' ? 'Completada' : 
                     selectedTask.status === 'in-progress' ? 'En Progreso' : 
                     'Pendiente'}
                  </DetailBadge>
                } 
              />
              <DetailField 
                label="Fecha de Creación" 
                value={selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString() : 'No disponible'} 
              />
              {selectedTask.dueDate && (
                <DetailField 
                  label="Fecha Límite" 
                  value={new Date(selectedTask.dueDate).toLocaleDateString()} 
                />
              )}
              <DetailField 
                label="Prioridad" 
                value={
                  <DetailBadge 
                    color={
                      selectedTask.priority === 'high' ? 'red' : 
                      selectedTask.priority === 'medium' ? 'yellow' : 
                      'blue'
                    }
                  >
                    {selectedTask.priority === 'high' ? 'Alta' : 
                     selectedTask.priority === 'medium' ? 'Media' : 
                     'Baja'}
                  </DetailBadge>
                } 
              />
            </DetailGrid>
          </DetailSection>

          {selectedTask.description && (
            <DetailSection title="Descripción">
              <p className="text-gray-300 whitespace-pre-line">{selectedTask.description}</p>
            </DetailSection>
          )}
        </DetailView>
      )}

      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Tareas</h1>
              <p className="mt-1 text-sm text-gray-300">Gestiona tus tareas con este tablero Kanban</p>
            </div>
          </div>
        
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map(column => (
                  <TaskColumn
                    key={column.id}
                    column={column}
                    tasks={getTasksByColumn(column.id)}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onMoveTask={handleMoveTask}
                  />
                ))}
              </div>
            </DndProvider>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 