'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { 
  LinkGroup, 
  Link, 
  getAllLinkGroups,
  getLinksByGroup,
  createLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
  createLink,
  updateLink,
  deleteLink,
  incrementLinkClick
} from '@/lib/linkService';
import LinkGroupCard from '@/components/links/LinkGroupCard';
import LinkGroupForm from '@/components/forms/LinkGroupForm';
import LinkForm from '@/components/forms/LinkForm';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function LinksPage() {
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [groupLinks, setGroupLinks] = useState<{ [groupId: string]: Link[] }>({});
  const [loading, setLoading] = useState(true);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LinkGroup | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);

  // Cargar grupos al montar el componente
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await getAllLinkGroups();
      setGroups(allGroups);
      
      // Obtener enlaces para cada grupo
      const linksMap: { [groupId: string]: Link[] } = {};
      
      for (const group of allGroups) {
        if (group.id) {
          const groupLinks = await getLinksByGroup(group.id);
          linksMap[group.id] = groupLinks;
        }
      }
      
      // Verificar si existe un grupo de Marketplaces
      const marketplacesGroup = allGroups.find(g => g.name === 'Marketplaces');
      
      // Si no existe, crear el grupo de Marketplaces
      if (!marketplacesGroup) {
        try {
          const marketplacesGroupId = await createLinkGroup({
            name: 'Marketplaces',
            description: 'Plataformas para vender y comprar',
            icon: '🛒',
            order: allGroups.length
          });
          
          // Crear enlaces para este grupo
          const marketplaceLinks = [
            {
              title: 'Wallapop',
              url: 'https://es.wallapop.com/',
              description: 'Marketplace de compra/venta de segunda mano',
              active: true
            },
            {
              title: 'eBay',
              url: 'https://www.ebay.es/',
              description: 'Plataforma global de subastas y compraventa',
              active: true
            },
            {
              title: 'Cardmarket',
              url: 'https://www.cardmarket.com/',
              description: 'Marketplace especializado en cartas coleccionables',
              active: true
            },
            {
              title: 'CardTrader',
              url: 'https://www.cardtrader.com/es/pokemon',
              description: 'Plataforma para comprar y vender cartas Pokémon',
              active: true
            },
            {
              title: 'Whatnot',
              url: 'https://www.whatnot.com/',
              description: 'Plataforma de subastas en vivo para coleccionables',
              active: true
            },
            {
              title: 'WordPress Admin',
              url: 'https://pokebim.com/wp-admin/',
              description: 'Panel de administración de la web',
              active: true
            },
            {
              title: 'TikTok',
              url: 'https://www.tiktok.com/',
              description: 'Plataforma de vídeos cortos',
              active: true
            },
            {
              title: 'Instagram Shopping',
              url: 'https://business.facebook.com/commerce/manager/',
              description: 'Gestión de productos en Instagram',
              active: true
            },
            {
              title: 'Facebook Marketplace',
              url: 'https://www.facebook.com/marketplace/',
              description: 'Marketplace de Facebook',
              active: true
            }
          ];
          
          // Añadir enlaces al grupo
          for (let i = 0; i < marketplaceLinks.length; i++) {
            const link = marketplaceLinks[i];
            await createLink({
              groupId: marketplacesGroupId,
              title: link.title,
              url: link.url,
              description: link.description || '',
              order: i,
              active: link.active
            });
          }
          
          // Actualizar la UI con el nuevo grupo y sus enlaces
          const newGroup: LinkGroup = {
            id: marketplacesGroupId,
            name: 'Marketplaces',
            description: 'Plataformas para vender y comprar',
            icon: '🛒',
            order: allGroups.length,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Obtener los enlaces recién creados
          const newLinks = await getLinksByGroup(marketplacesGroupId);
          
          // Actualizar el estado
          setGroups(prev => [newGroup, ...prev]);
          setGroupLinks(prev => ({ ...prev, [marketplacesGroupId]: newLinks }));
          
          showNotification('Grupo de Marketplaces creado automáticamente');
        } catch (err) {
          console.error('Error al crear el grupo de Marketplaces:', err);
        }
      }
      
      setGroupLinks(linksMap);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los grupos:', err);
      setError('Error al cargar los grupos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funciones para gestionar grupos
  
  const handleCreateGroup = async (groupData: Omit<LinkGroup, 'id' | 'order'>) => {
    try {
      const groupId = await createLinkGroup({
        ...groupData,
        order: 0 // Este valor será ignorado y establecido por el servicio
      });
      
      // Actualizar la interfaz de usuario
      const newGroup: LinkGroup = {
        id: groupId,
        ...groupData,
        order: groups.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setGroups(prev => [newGroup, ...prev]);
      setGroupLinks(prev => ({ ...prev, [groupId]: [] }));
      
      // Cerrar modal y mostrar notificación
      setGroupModalOpen(false);
      showNotification('Grupo creado correctamente');
    } catch (err) {
      console.error('Error creating group:', err);
      throw err;
    }
  };
  
  const handleUpdateGroup = async (groupData: Omit<LinkGroup, 'id' | 'order'>) => {
    if (!editingGroup?.id) return;
    
    try {
      await updateLinkGroup(editingGroup.id, groupData);
      
      // Actualizar la interfaz de usuario
      setGroups(prev => prev.map(group => {
        if (group.id === editingGroup.id) {
          return {
            ...group,
            ...groupData,
            updatedAt: new Date()
          };
        }
        return group;
      }));
      
      // Cerrar modal y mostrar notificación
      setGroupModalOpen(false);
      setEditingGroup(null);
      showNotification('Grupo actualizado correctamente');
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteLinkGroup(groupId);
      
      // Actualizar la interfaz de usuario
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      // Eliminar los enlaces del grupo del estado
      const updatedGroupLinks = { ...groupLinks };
      delete updatedGroupLinks[groupId];
      setGroupLinks(updatedGroupLinks);
      
      showNotification('Grupo eliminado correctamente');
    } catch (err) {
      console.error('Error deleting group:', err);
      showNotification('Error al eliminar el grupo', 'error');
    }
  };
  
  // Funciones para gestionar enlaces
  
  const handleOpenLinkModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setEditingLink(null);
    setLinkModalOpen(true);
  };
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setSelectedGroupId(link.groupId);
    setLinkModalOpen(true);
  };
  
  const handleCreateLink = async (linkData: Omit<Link, 'id' | 'order' | 'clicks'>) => {
    try {
      const linkId = await createLink(linkData);
      
      // Actualizar la interfaz de usuario
      const newLink: Link = {
        id: linkId,
        ...linkData,
        order: groupLinks[linkData.groupId]?.length || 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setGroupLinks(prev => ({
        ...prev,
        [linkData.groupId]: [newLink, ...(prev[linkData.groupId] || [])]
      }));
      
      // Cerrar modal y mostrar notificación
      setLinkModalOpen(false);
      setSelectedGroupId(null);
      showNotification('Enlace creado correctamente');
    } catch (err) {
      console.error('Error creating link:', err);
      throw err;
    }
  };
  
  const handleUpdateLink = async (linkData: Omit<Link, 'id' | 'order' | 'clicks'>) => {
    if (!editingLink?.id) return;
    
    try {
      await updateLink(editingLink.id, linkData);
      
      // Actualizar la interfaz de usuario
      setGroupLinks(prev => ({
        ...prev,
        [linkData.groupId]: prev[linkData.groupId].map(link => {
          if (link.id === editingLink.id) {
            return {
              ...link,
              ...linkData,
              updatedAt: new Date()
            };
          }
          return link;
        })
      }));
      
      // Cerrar modal y mostrar notificación
      setLinkModalOpen(false);
      setEditingLink(null);
      setSelectedGroupId(null);
      showNotification('Enlace actualizado correctamente');
    } catch (err) {
      console.error('Error updating link:', err);
      throw err;
    }
  };
  
  const handleDeleteLink = async (linkId: string) => {
    try {
      // Encontrar a qué grupo pertenece el enlace
      let groupId: string | null = null;
      let linkToDelete: Link | null = null;
      
      for (const [gId, links] of Object.entries(groupLinks)) {
        const link = links.find(l => l.id === linkId);
        if (link) {
          groupId = gId;
          linkToDelete = link;
          break;
        }
      }
      
      if (!groupId || !linkToDelete) return;
      
      await deleteLink(linkId);
      
      // Actualizar la interfaz de usuario
      setGroupLinks(prev => ({
        ...prev,
        [groupId!]: prev[groupId!].filter(link => link.id !== linkId)
      }));
      
      showNotification('Enlace eliminado correctamente');
    } catch (err) {
      console.error('Error deleting link:', err);
      showNotification('Error al eliminar el enlace', 'error');
    }
  };
  
  const handleLinkClick = async (linkId: string) => {
    try {
      // Incrementar contador en la base de datos
      await incrementLinkClick(linkId);
      
      // Actualizar la interfaz de usuario
      for (const groupId in groupLinks) {
        setGroupLinks(prev => ({
          ...prev,
          [groupId]: prev[groupId].map(link => {
            if (link.id === linkId) {
              return {
                ...link,
                clicks: (link.clicks || 0) + 1
              };
            }
            return link;
          })
        }));
      }
    } catch (err) {
      console.error('Error incrementing link click:', err);
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: 'success'
      });
    }, 3000);
  };

  return (
    <MainLayout>
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white border-l-4 border-green-400' : 'bg-red-700 text-white border-l-4 border-red-400'
        } transition-opacity duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
      
      {/* Modal para grupos de enlaces */}
      <Modal 
        isOpen={groupModalOpen} 
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        title={editingGroup ? 'Editar grupo de enlaces' : 'Crear nuevo grupo de enlaces'}
      >
        <LinkGroupForm 
          initialData={editingGroup}
          onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} 
          onCancel={() => {
            setGroupModalOpen(false);
            setEditingGroup(null);
          }}
        />
      </Modal>
      
      {/* Modal para enlaces */}
      <Modal 
        isOpen={linkModalOpen} 
        onClose={() => {
          setLinkModalOpen(false);
          setEditingLink(null);
          setSelectedGroupId(null);
        }}
        title={editingLink ? 'Editar enlace' : 'Crear nuevo enlace'}
      >
        {selectedGroupId && (
          <LinkForm 
            groupId={selectedGroupId}
            initialData={editingLink}
            onSubmit={editingLink ? handleUpdateLink : handleCreateLink} 
            onCancel={() => {
              setLinkModalOpen(false);
              setEditingLink(null);
              setSelectedGroupId(null);
            }}
          />
        )}
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Links
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Organiza y gestiona tus enlaces en grupos personalizados
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              {/* El botón para importar enlaces de Pokémon está ahora oculto */}
              {/* Botón para eliminar duplicados */}
              {groups.length > 0 && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Buscar el grupo "Webs Compra Pokemon"
                        const pokemonGroup = groups.find(g => g.name === "Webs Compra Pokemon");
                        
                        if (!pokemonGroup || !pokemonGroup.id) {
                          showNotification('No se encontró el grupo "Webs Compra Pokemon"', 'error');
                          return;
                        }
                        
                        if (confirm(`¿Eliminar enlaces duplicados del grupo "${pokemonGroup.name}"?`)) {
                          setLoading(true);
                          const response = await fetch(`/api/links/remove-duplicates?groupId=${pokemonGroup.id}`);
                          const data = await response.json();
                          
                          if (data.success) {
                            showNotification(data.message);
                            // Recargar la página para mostrar los cambios
                            await fetchGroups();
                          } else {
                            showNotification(data.error || 'Error al eliminar duplicados', 'error');
                          }
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        showNotification('Error al eliminar duplicados', 'error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-700 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    Eliminar Duplicados
                  </button>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-xs text-gray-300 p-2 rounded shadow-lg w-48">
                    Elimina enlaces duplicados en el grupo "Webs Compra Pokemon"
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setGroupModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Nuevo grupo
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
          
          {/* Lista de grupos */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay grupos de enlaces creados.</p>
                <button
                  onClick={() => setGroupModalOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Crear tu primer grupo de enlaces
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map(group => (
                  <LinkGroupCard
                    key={group.id}
                    group={group}
                    links={groupLinks[group.id!] || []}
                    onEditGroup={setEditingGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onAddLink={handleOpenLinkModal}
                    onEditLink={handleEditLink}
                    onDeleteLink={handleDeleteLink}
                    onLinkClick={handleLinkClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 