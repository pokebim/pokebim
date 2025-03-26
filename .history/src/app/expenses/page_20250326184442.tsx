'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import CompanyExpenseForm from '@/components/forms/CompanyExpenseForm';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  CompanyExpense,
  getAllCompanyExpenses,
  addCompanyExpense,
  updateCompanyExpense,
  deleteCompanyExpense
} from '@/lib/companyExpenseService';
import { toast } from 'react-hot-toast';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';
import { getAllSales } from '@/lib/salesService';

// Simple Tooltip component
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-gray-900 text-white text-xs p-2 rounded w-64 -translate-x-1/2 left-1/2 bottom-full mb-1">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

// Collapsible Section component
const CollapsibleSection = ({ title, children, defaultOpen = true, tooltipContent }: { 
  title: string, 
  children: React.ReactNode, 
  defaultOpen?: boolean,
  tooltipContent?: string 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <h3 className="text-white font-medium">
            {title}
          </h3>
          {tooltipContent && (
            <Tooltip content={tooltipContent}>
              <svg className="w-4 h-4 ml-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
            </Tooltip>
          )}
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};

// Componente para mostrar el badge del estado de pago
const PaymentStatusBadge = ({ isPaid }: { isPaid: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isPaid 
      ? 'bg-green-900 text-green-200' 
      : 'bg-yellow-900 text-yellow-200'
  }`}>
    {isPaid ? 'Pagado' : 'Pendiente'}
  </span>
);

// Componente para mostrar el badge de asignación
const AssignedToBadge = ({ assignedTo }: { assignedTo?: string }) => {
  if (!assignedTo) return null;
  
  const bgColor = 
    assignedTo === 'edmon' ? 'bg-blue-900 text-blue-200' : 
    assignedTo === 'albert' ? 'bg-purple-900 text-purple-200' : 
    'bg-red-900 text-red-200';
  
  const label = 
    assignedTo === 'edmon' ? 'Pagado a Edmon' : 
    assignedTo === 'albert' ? 'Pagado a Albert' : 
    'Pagado a Biel';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {label}
    </span>
  );
};

// Componente para la página principal de gastos
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [filterPaidBy, setFilterPaidBy] = useState<string>('all');
  // Nuevo estado para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<CompanyExpense | null>(null);
  // Nuevo estado para preseleccionar la categoría de impuestos
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  // Estado para almacenar el total de ventas
  const [totalSales, setTotalSales] = useState<number>(0);

  // Cargar los datos de ventas
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const salesData = await getAllSales();
        // Calcular el total de ventas
        const total = salesData.reduce((sum, sale) => {
          const pricePerUnit = sale.hasVAT ? sale.totalWithVAT : sale.price;
          const quantity = sale.quantity || 1;
          return sum + (pricePerUnit * quantity);
        }, 0);
        setTotalSales(total);
      } catch (error) {
        console.error('Error al cargar las ventas:', error);
      }
    };

    fetchSalesData();
  }, []);

  // Cargar los gastos al montar el componente
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Función para cargar todos los gastos
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getAllCompanyExpenses();
      setExpenses(data);
      setError(null);
    } catch (error) {
      console.error('Error al cargar los gastos:', error);
      setError('No se pudieron cargar los gastos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar la eliminación de un gasto
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }
    
    try {
      // Primero obtenemos los impuestos relacionados con este gasto
      const relatedTaxes = getRelatedTaxExpenses(id);
      
      // Eliminamos el gasto principal
      await deleteCompanyExpense(id);
      
      // Ahora eliminamos todos los impuestos relacionados
      for (const tax of relatedTaxes) {
        if (tax.id) {
          await deleteCompanyExpense(tax.id);
        }
      }
      
      // Actualizar el estado de la UI para eliminar tanto el gasto como sus impuestos
      setExpenses(prev => prev.filter(expense => 
        expense.id !== id && expense.relatedExpenseId !== id
      ));
      
      toast.success('Gasto e impuestos relacionados eliminados correctamente');
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  // Manejar la edición de un gasto
  const handleEdit = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setPreselectedCategory(null);
    setModalOpen(true);
  };

  // Nuevo método para manejar la adición de impuestos a un gasto existente
  const handleAddTaxToExpense = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setPreselectedCategory('Impuestos');
    setModalOpen(true);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (formData: Partial<CompanyExpense>) => {
    try {
      if (editingExpense && editingExpense.id) {
        // Si estamos añadiendo un impuesto a un gasto existente
        if (preselectedCategory === 'Impuestos' && editingExpense.category !== 'Impuestos') {
          // Crear un nuevo gasto para el impuesto, vinculado al gasto original
          const taxExpense: Omit<CompanyExpense, 'id' | 'createdAt' | 'updatedAt'> = {
            name: `Impuesto: ${editingExpense.name}`,
            price: formData.price || 0,
            link: '',
            paidBy: editingExpense.paidBy || 'edmon',
            isPaid: editingExpense.isPaid || false,
            paymentDate: editingExpense.paymentDate || null,
            category: 'Impuestos',
            notes: `Impuesto asociado al gasto: ${editingExpense.name}`,
            taxType: formData.taxType || '',
            taxBase: formData.taxBase || 0,
            taxRate: formData.taxRate || 0,
            relatedExpenseId: editingExpense.id
          };
          
          // Añadir el nuevo gasto de impuesto
          const newId = await addCompanyExpense(taxExpense);
          
          // Actualizar el estado local con el nuevo gasto de impuesto
          const newExpense: CompanyExpense = {
            id: newId,
            ...taxExpense,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setExpenses(prev => [newExpense, ...prev]);
          
          toast.success('Impuesto añadido correctamente al gasto existente');
        } else {
          // Actualizar un gasto existente normalmente
          await updateCompanyExpense(editingExpense.id, formData);
          
          // Actualizar el estado local
          setExpenses(prev => 
            prev.map(expense => 
              expense.id === editingExpense.id 
                ? { ...expense, ...formData, updatedAt: new Date() } 
                : expense
            )
          );
          
          toast.success('Gasto actualizado correctamente');
        }
      } else {
        // Añadir un nuevo gasto
        const newId = await addCompanyExpense(formData as Omit<CompanyExpense, 'id' | 'createdAt' | 'updatedAt'>);
        
        // Actualizar el estado local
        const newExpense: CompanyExpense = {
          id: newId,
          ...formData as Omit<CompanyExpense, 'id'>,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setExpenses(prev => [newExpense, ...prev]);
        
        toast.success('Gasto añadido correctamente');
      }
      
      // Cerrar el modal y limpiar el estado de edición
      setModalOpen(false);
      setEditingExpense(null);
      setPreselectedCategory(null);
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
      toast.error('Error al guardar el gasto');
    }
  };

  // Función para abrir la vista detallada
  const handleViewDetail = (expense: CompanyExpense) => {
    setSelectedExpense(expense);
    setDetailViewOpen(true);
  };

  // Función para abrir el modal de nuevo gasto
  const openNewExpenseModal = (category: string | null = null) => {
    setEditingExpense(null);
    setPreselectedCategory(category);
    setModalOpen(true);
  };

  // Filtrar los gastos según el filtro seleccionado
  const filteredExpenses = useMemo(() => {
    // Primero obtenemos una lista de IDs de los gastos que son impuestos
    // relacionados con otros gastos, para excluirlos de la vista principal
    const taxExpenseIds = expenses
      .filter(expense => expense.category === 'Impuestos' && expense.relatedExpenseId)
      .map(expense => expense.id);
    
    // Filtramos para excluir los impuestos que están relacionados con gastos existentes
    // ya que mostraremos esa información en la misma línea del gasto original
    let filtered = expenses.filter(expense => !taxExpenseIds.includes(expense.id));
    
    // Aplicamos el filtro de persona
    if (filterPaidBy !== 'all') {
      filtered = filtered.filter(expense => expense.paidBy === filterPaidBy);
    }
    
    return filtered;
  }, [expenses, filterPaidBy]);

  // Función para obtener los impuestos relacionados a un gasto
  const getRelatedTaxExpenses = (expenseId: string) => {
    return expenses.filter(expense => 
      expense.relatedExpenseId === expenseId && 
      expense.category === 'Impuestos'
    );
  };

  // Verificar si un gasto tiene impuestos asociados
  const hasRelatedTaxExpense = (expenseId: string) => {
    return expenses.some(expense => 
      expense.relatedExpenseId === expenseId && 
      expense.category === 'Impuestos'
    );
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.price, 0);
    
    // Calcular pagos por persona
    const byPerson = {
      edmon: expenses.filter(e => e.paidBy === 'edmon').reduce((sum, e) => sum + e.price, 0),
      albert: expenses.filter(e => e.paidBy === 'albert').reduce((sum, e) => sum + e.price, 0),
      biel: expenses.filter(e => e.paidBy === 'biel').reduce((sum, e) => sum + e.price, 0),
      todos: expenses.filter(e => e.paidBy === 'todos').reduce((sum, e) => sum + e.price, 0)
    };
    
    // Calcular gastos asignados a cada persona
    const assignedToPerson = {
      edmon: expenses.filter(e => e.assignedTo === 'edmon').reduce((sum, e) => sum + e.price, 0),
      albert: expenses.filter(e => e.assignedTo === 'albert').reduce((sum, e) => sum + e.price, 0),
      biel: expenses.filter(e => e.assignedTo === 'biel').reduce((sum, e) => sum + e.price, 0),
    };
    
    // Calcular totales netos (pagos - asignaciones)
    const netByPerson = {
      edmon: byPerson.edmon - assignedToPerson.edmon,
      albert: byPerson.albert - assignedToPerson.albert,
      biel: byPerson.biel - assignedToPerson.biel,
      todos: byPerson.todos
    };
    
    // Total neto (suma de los netos individuales)
    const netTotal = netByPerson.edmon + netByPerson.albert + netByPerson.biel + netByPerson.todos;
    
    // Consider sales income (attributed to Biel, as he keeps the sales money)
    const salesAttribution = {
      edmon: 0,
      albert: 0,
      biel: totalSales || 0, // All sales money is attributed to Biel
    };
    
    // Cálculo de reparto equitativo considerando ventas
    const totalGasto = netTotal; // El total neto que debe ser repartido
    const totalIngresos = totalSales || 0; // Total de ingresos por ventas
    const netBeneficio = totalIngresos - totalGasto; // Beneficio neto
    const parteEquitativa = totalGasto / 3; // División entre las 3 personas
    const parteEquitativaIngresos = totalIngresos / 3; // Cada persona debería recibir 1/3 de los ingresos
    
    // Diferencia entre lo que ha pagado cada uno y lo que debería pagar para que sea equitativo
    const balanceEquitativo = {
      edmon: parteEquitativa - netByPerson.edmon, // Positivo: debe pagar, Negativo: debe recibir
      albert: parteEquitativa - netByPerson.albert,
      biel: parteEquitativa - netByPerson.biel
    };

    // Biel tiene todo el dinero de ventas, pero debería repartirlo equitativamente
    const ventasARepartir = {
      edmon: parteEquitativaIngresos, // Lo que Edmon debería recibir de las ventas
      albert: parteEquitativaIngresos, // Lo que Albert debería recibir de las ventas
      biel: parteEquitativaIngresos - totalIngresos // Lo que Biel debería pagar (negativo) por tener todo el dinero
    };
    
    // Balance final considerando gastos + ventas
    const balanceFinal = {
      edmon: balanceEquitativo.edmon - ventasARepartir.edmon, // Resta lo que debería recibir de ventas
      albert: balanceEquitativo.albert - ventasARepartir.albert, // Resta lo que debería recibir de ventas
      biel: balanceEquitativo.biel - ventasARepartir.biel // Resta lo que debe pagar por tener todas las ventas
    };
    
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + expense.price;
      return acc;
    }, {} as Record<string, number>);
    
    const pendingPayment = expenses.filter(e => !e.isPaid).length;
    const paid = expenses.filter(e => e.isPaid).length;
    
    return {
      total,
      netTotal,
      byPerson,
      assignedToPerson,
      netByPerson,
      byCategory,
      pendingPayment,
      paid,
      parteEquitativa,
      balanceEquitativo,
      totalIngresos,
      netBeneficio,
      beneficioEquitativo: netBeneficio / 3,
      balanceFinal,
      salesAttribution
    };
  }, [expenses, totalSales]);

  // Función para renderizar el paidBy como badge
  const renderPaidByBadge = (paidBy: string) => {
    let color: 'blue' | 'red' | 'yellow' | 'purple' = 'blue';
    let displayText = '';
    
    switch(paidBy) {
      case 'edmon':
        displayText = 'Edmon';
        color = 'blue';
        break;
      case 'albert':
        displayText = 'Albert';
        color = 'red';
        break;
      case 'biel':
        displayText = 'Biel';
        color = 'yellow';
        break;
      case 'todos':
        displayText = 'Todos';
        color = 'purple';
        break;
      default:
        displayText = paidBy;
    }
    
    return <DetailBadge color={color}>{displayText}</DetailBadge>;
  };

  // Obtiene el gasto original de un impuesto
  const getOriginalExpense = (taxExpense: CompanyExpense) => {
    if (taxExpense.relatedExpenseId) {
      return expenses.find(expense => expense.id === taxExpense.relatedExpenseId);
    }
    return null;
  };

  // Definir las columnas de la tabla
  const columnHelper = createColumnHelper<CompanyExpense>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => <span className="text-white">{info.getValue().toFixed(2)} €</span>
    }),
    columnHelper.accessor('category', {
      header: 'Categoría',
      cell: info => <span className="text-gray-300">{info.getValue() || 'Sin categoría'}</span>
    }),
    columnHelper.display({
      id: 'taxDetails',
      header: 'Detalles Impuesto',
      cell: info => {
        const expense = info.row.original;
        
        // Si el gasto mismo es un impuesto, mostrar sus detalles
        if (expense.category === 'Impuestos' && expense.taxType) {
          return (
            <div className="text-sm">
              <span className="text-indigo-400 font-medium">{expense.taxType}</span>
              {expense.taxBase ? (
                <div className="text-gray-400">
                  Base: {expense.taxBase.toFixed(2)}€ ({expense.taxRate}%)
                </div>
              ) : null}
            </div>
          );
        }
        
        // Si el gasto tiene impuestos relacionados, mostrarlos aquí
        if (hasRelatedTaxExpense(expense.id!)) {
          const relatedTaxes = getRelatedTaxExpenses(expense.id!);
          
          return (
            <div className="space-y-1">
              {relatedTaxes.map((tax, index) => (
                <div key={tax.id} className="text-sm bg-gray-800 p-1.5 rounded">
                  <span className="text-indigo-400 font-medium">{tax.taxType}</span>
                  {tax.taxBase ? (
                    <div className="text-gray-400">
                      Base: {tax.taxBase.toFixed(2)}€ ({tax.taxRate}%) = {tax.price.toFixed(2)}€
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          );
        }
        
        return null;
      }
    }),
    columnHelper.accessor('paidBy', {
      header: 'Pagado por',
      cell: info => {
        const value = info.getValue();
        let displayText = '';
        let bgClass = '';
        
        switch(value) {
          case 'edmon':
            displayText = 'Edmon';
            bgClass = 'bg-blue-900 text-blue-200';
            break;
          case 'albert':
            displayText = 'Albert';
            bgClass = 'bg-red-900 text-red-200';
            break;
          case 'biel':
            displayText = 'Biel';
            bgClass = 'bg-yellow-900 text-yellow-200';
            break;
          case 'todos':
            displayText = 'Todos';
            bgClass = 'bg-purple-900 text-purple-200';
            break;
          default:
            displayText = value;
            bgClass = 'bg-gray-900 text-gray-200';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`}>
            {displayText}
          </span>
        );
      }
    }),
    columnHelper.accessor('isPaid', {
      header: 'Estado',
      cell: info => <PaymentStatusBadge isPaid={info.getValue()} />
    }),
    columnHelper.accessor('assignedTo', {
      header: 'Pagado a',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AssignedToBadge assignedTo={row.original.assignedTo} />
        </div>
      ),
      enableSorting: true
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => {
        const expense = info.row.original;
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewDetail(expense)}
              className="px-3 py-1 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={() => handleEdit(expense)}
              className="px-3 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Editar
            </button>
            {expense.category !== 'Impuestos' && (
              <button
                onClick={() => handleAddTaxToExpense(expense)}
                className="px-3 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600 transition-colors"
                title="Añadir información de impuestos a este gasto"
              >
                + Impuesto
              </button>
            )}
            <button
              onClick={() => handleDelete(info.getValue() as string)}
              className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        );
      }
    })
  ], [expenses]);

  return (
    <MainLayout>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
          setPreselectedCategory(null);
        }}
        title={
          editingExpense 
            ? preselectedCategory === "Impuestos" 
              ? `Añadir impuesto a: ${editingExpense.name}`
              : "Editar gasto" 
            : preselectedCategory === "Impuestos" 
              ? "Añadir impuesto" 
              : "Añadir nuevo gasto"
        }
      >
        <CompanyExpenseForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingExpense(null);
            setPreselectedCategory(null);
          }}
          initialData={editingExpense}
          preselectedCategory={preselectedCategory}
        />
      </Modal>

      {/* Vista detallada del gasto */}
      {selectedExpense && (
        <Modal
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle del Gasto: ${selectedExpense.name}`}
          size="lg"
        >
          <DetailView>
            <DetailSection title="Información General">
              <DetailGrid columns={2}>
                <DetailField label="Nombre" value={selectedExpense.name} />
                <DetailField 
                  label="Precio" 
                  value={`${selectedExpense.price.toFixed(2)} €`}
                  valueClassName="text-green-400 font-medium"
                />
                <DetailField 
                  label="Pagado Por" 
                  value={
                    selectedExpense.paidBy === 'edmon' ? 'Edmon' : 
                    selectedExpense.paidBy === 'albert' ? 'Albert' : 
                    selectedExpense.paidBy === 'biel' ? 'Biel' : 'Todos'
                  } 
                />
                {selectedExpense.assignedTo && (
                  <DetailField 
                    label="Pagado A" 
                    value={
                      selectedExpense.assignedTo === 'edmon' ? 'Edmon' : 
                      selectedExpense.assignedTo === 'albert' ? 'Albert' : 
                      selectedExpense.assignedTo === 'biel' ? 'Biel' : '-'
                    } 
                    valueClassName={
                      selectedExpense.assignedTo === 'edmon' ? 'text-blue-400' : 
                      selectedExpense.assignedTo === 'albert' ? 'text-purple-400' : 
                      selectedExpense.assignedTo === 'biel' ? 'text-red-400' : ''
                    }
                  />
                )}
                <DetailField 
                  label="Estado" 
                  value={<PaymentStatusBadge isPaid={selectedExpense.isPaid} />} 
                />
                <DetailField 
                  label="Fecha de pago" 
                  value={selectedExpense.paymentDate ? new Date(selectedExpense.paymentDate).toLocaleDateString() : 'No pagado'} 
                />
              </DetailGrid>
            </DetailSection>

            {/* Información adicional */}
            <DetailSection title="Información Adicional">
              <DetailGrid columns={1}>
                {/* Mostrar enlace si existe */}
                {selectedExpense.link && (
                  <DetailField 
                    label="Enlace" 
                    value={
                      <a 
                        href={selectedExpense.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:underline"
                      >
                        Ver producto
                      </a>
                    } 
                  />
                )}

                {/* Mostrar notas si existen */}
                {selectedExpense.notes && (
                  <DetailField 
                    label="Notas" 
                    value={selectedExpense.notes} 
                  />
                )}

                {/* Información de impuestos si es un impuesto */}
                {selectedExpense.category === 'Impuestos' && (
                  <>
                    <DetailField 
                      label="Tipo de Impuesto" 
                      value={selectedExpense.taxType || '-'} 
                    />
                    <DetailField 
                      label="Base Imponible" 
                      value={selectedExpense.taxBase ? `${selectedExpense.taxBase.toFixed(2)} €` : '-'} 
                    />
                    <DetailField 
                      label="Tasa Impositiva" 
                      value={selectedExpense.taxRate ? `${selectedExpense.taxRate}%` : '-'} 
                    />
                  </>
                )}
              </DetailGrid>
            </DetailSection>

            {/* Fechas */}
            <DetailSection title="Metadatos">
              <DetailGrid columns={2}>
                <DetailField 
                  label="Creado" 
                  value={selectedExpense.createdAt ? new Date(selectedExpense.createdAt).toLocaleString() : '-'} 
                />
                <DetailField 
                  label="Actualizado" 
                  value={selectedExpense.updatedAt ? new Date(selectedExpense.updatedAt).toLocaleString() : '-'} 
                />
              </DetailGrid>
            </DetailSection>

            {/* Botones de acción */}
            <div className="mt-6 flex space-x-4 justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => {
                  setDetailViewOpen(false);
                  handleEdit(selectedExpense);
                }}
              >
                Editar
              </button>
              {selectedExpense.category !== 'Impuestos' && (
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setDetailViewOpen(false);
                    handleAddTaxToExpense(selectedExpense);
                  }}
                >
                  Añadir Impuesto
                </button>
              )}
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={() => {
                  setDetailViewOpen(false);
                  handleDelete(selectedExpense.id!);
                }}
              >
                Eliminar
              </button>
            </div>
          </DetailView>
        </Modal>
      )}

      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Gastos Empresariales
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona los gastos de material, web, y otros recursos para la empresa.
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={fetchExpenses}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => openNewExpenseModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Añadir Gasto
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-900 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar estadísticas al inicio de la página */}
          <CollapsibleSection 
            title="Resumen de Estadísticas" 
            tooltipContent="Vista general de ventas, gastos y contribuciones individuales"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              {/* New cards for Sales and Profit */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <Tooltip content="Suma total de todas las ventas registradas en el sistema">
                      <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                        Total Ventas
                        <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                      </h3>
                    </Tooltip>
                    <p className="text-2xl font-semibold text-white">{totalSales?.toFixed(2) || "0.00"} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <Tooltip content="Diferencia entre ventas y gastos. Positivo indica beneficio, negativo indica pérdida.">
                      <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                        Beneficios
                        <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                      </h3>
                    </Tooltip>
                    <p className="text-2xl font-semibold text-white">{(totalSales - stats.netTotal).toFixed(2) || "0.00"} €</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <Tooltip content="Suma total de todos los gastos registrados en el sistema">
                      <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                        Total Gastos
                        <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                      </h3>
                    </Tooltip>
                    <p className="text-2xl font-semibold text-white">{stats.netTotal.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
            </div>
            
            <CollapsibleSection
              title="Desglose por persona"
              tooltipContent="Detalle de lo que ha pagado cada persona y su balance de gastos"
              defaultOpen={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <Tooltip content="Total de gastos pagados por Edmon menos los gastos asignados a él">
                        <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                          Pagado por Edmon
                          <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                          </svg>
                        </h3>
                      </Tooltip>
                      <p className="text-xl font-semibold text-white">{stats.byPerson.edmon.toFixed(2)} €</p>
                      {stats.assignedToPerson.edmon > 0 && (
                        <div className="mt-1">
                          <Tooltip content="Gastos que han sido asignados específicamente a Edmon">
                            <span className="text-sm text-gray-400 flex items-center">
                              Pagado a: -{stats.assignedToPerson.edmon.toFixed(2)} €
                              <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                              </svg>
                            </span>
                          </Tooltip>
                          <Tooltip content="Resultado neto: gastos pagados menos gastos asignados">
                            <p className="text-md font-semibold text-white flex items-center">
                              Neto: {stats.netByPerson.edmon.toFixed(2)} €
                              <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                              </svg>
                            </p>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <Tooltip content="Balance de gastos: diferencia entre lo que debería pagar equitativamente y lo que ha pagado">
                      <div className={`text-sm flex items-center ${stats.balanceEquitativo.edmon > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {stats.balanceEquitativo.edmon > 0 
                          ? `Debe pagar: ${stats.balanceEquitativo.edmon.toFixed(2)} €` 
                          : `Debe recibir: ${Math.abs(stats.balanceEquitativo.edmon).toFixed(2)} €`}
                        <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <Tooltip content="Total de gastos pagados por Albert menos los gastos asignados a él">
                        <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                          Pagado por Albert
                          <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                          </svg>
                        </h3>
                      </Tooltip>
                      <p className="text-xl font-semibold text-white">{stats.byPerson.albert.toFixed(2)} €</p>
                      {stats.assignedToPerson.albert > 0 && (
                        <div className="mt-1">
                          <Tooltip content="Gastos que han sido asignados específicamente a Albert">
                            <span className="text-sm text-gray-400 flex items-center">
                              Pagado a: -{stats.assignedToPerson.albert.toFixed(2)} €
                              <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                              </svg>
                            </span>
                          </Tooltip>
                          <Tooltip content="Resultado neto: gastos pagados menos gastos asignados">
                            <p className="text-md font-semibold text-white flex items-center">
                              Neto: {stats.netByPerson.albert.toFixed(2)} €
                              <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                              </svg>
                            </p>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <Tooltip content="Balance de gastos: diferencia entre lo que debería pagar equitativamente y lo que ha pagado">
                      <div className={`text-sm flex items-center ${stats.balanceEquitativo.albert > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {stats.balanceEquitativo.albert > 0 
                          ? `Debe pagar: ${stats.balanceEquitativo.albert.toFixed(2)} €` 
                          : `Debe recibir: ${Math.abs(stats.balanceEquitativo.albert).toFixed(2)} €`}
                        <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <Tooltip content="Total de gastos pagados por Biel menos los gastos asignados a él">
                        <h3 className="text-gray-400 mb-1 text-sm flex items-center">
                          Pagado por Biel
                          <svg className="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                          </svg>
                        </h3>
                      </Tooltip>
                      <p className="text-xl font-semibold text-white">{stats.byPerson.biel.toFixed(2)} €</p>
                      {stats.assignedToPerson.biel > 0 && (
                        <div className="mt-1">
                          <Tooltip content="Gastos que han sido asignados específicamente a Biel">
                            <span className="text-sm text-gray-400 flex items-center">
                              Pagado a: -{stats.assignedToPerson.biel.toFixed(2)} €
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                className="w-full sm:w-48 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              >
                <option value="all">Todos</option>
                <option value="edmon">Edmon</option>
                <option value="albert">Albert</option>
                <option value="biel">Biel</option>
                <option value="todos">Pagado por todos</option>
              </select>
            </div>
          </div>

          {/* Tabla de gastos */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <span className="ml-3 text-white">Cargando gastos...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-400">
                  No hay gastos registrados{filterPaidBy !== 'all' ? ` para ${filterPaidBy}` : ''}.
                </p>
                <div className="mt-6 flex space-x-3 justify-center">
                  <button
                    type="button"
                    onClick={() => openNewExpenseModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Añadir gasto
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <DataTable
                  data={filteredExpenses}
                  columns={columns}
                  searchPlaceholder="Buscar por nombre, categoría..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 