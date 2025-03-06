'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllProducts, 
  updateCardmarketPrice, 
  updateBulkCardmarketPrices 
} from '@/lib/productService';
import { Product } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ProductImage from '@/components/ui/ProductImage';
import { formatCurrency } from '@/lib/utils';

export default function CardmarketPricesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [bulkUpdateText, setBulkUpdateText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Obtener todos los productos al cargar la página
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await getAllProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast.error('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Extraer tipos y lenguajes únicos para los filtros
  const uniqueTypes = ['all', ...new Set(products.map(p => p.type || 'sin tipo'))];
  const uniqueLanguages = ['all', ...new Set(products.map(p => p.language || 'es'))];
  
  // Filtrar productos según los criterios de búsqueda
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || product.type === selectedType;
    const matchesLanguage = selectedLanguage === 'all' || product.language === selectedLanguage;
    
    return matchesSearch && matchesType && matchesLanguage;
  });
  
  // Actualizar el precio de Cardmarket para un producto
  const handlePriceUpdate = async (id: string, newPrice: number) => {
    try {
      await updateCardmarketPrice(id, newPrice);
      
      // Actualizar el estado local
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === id ? { ...p, cardmarketPrice: newPrice, lastPriceUpdate: new Date() } : p
        )
      );
      
      toast.success('Precio actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el precio:', error);
      toast.error('Error al actualizar el precio');
    }
  };
  
  // Procesar actualización masiva de precios
  const handleBulkUpdate = async () => {
    try {
      // Parsear el texto de entrada
      // Formato esperado: ID_PRODUCTO,PRECIO\nID_PRODUCTO2,PRECIO2\n...
      const lines = bulkUpdateText.trim().split('\n');
      const updates: {id: string, price: number}[] = [];
      
      for (const line of lines) {
        const [id, priceStr] = line.split(',');
        if (id && priceStr) {
          const price = parseFloat(priceStr.trim());
          if (!isNaN(price) && price >= 0) {
            updates.push({ id: id.trim(), price });
          }
        }
      }
      
      if (updates.length === 0) {
        toast.error('No se encontraron actualizaciones válidas');
        return;
      }
      
      // Ejecutar la actualización masiva
      await updateBulkCardmarketPrices(updates);
      
      // Actualizar el estado local
      setProducts(prevProducts => 
        prevProducts.map(p => {
          const update = updates.find(u => u.id === p.id);
          if (update) {
            return { ...p, cardmarketPrice: update.price, lastPriceUpdate: new Date() };
          }
          return p;
        })
      );
      
      toast.success(`Se actualizaron ${updates.length} precios correctamente`);
      setIsDialogOpen(false);
      setBulkUpdateText('');
    } catch (error) {
      console.error('Error en la actualización masiva:', error);
      toast.error('Error en la actualización masiva de precios');
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Precios de Cardmarket</h1>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="manual">Actualización Manual</TabsTrigger>
          <TabsTrigger value="bulk">Actualización Masiva</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Actualización Manual de Precios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar Producto</Label>
                  <Input
                    id="search"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-1/4">
                  <Label htmlFor="type">Filtrar por Tipo</Label>
                  <select
                    id="type"
                    className="w-full p-2 border rounded"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'Todos los tipos' : type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-1/4">
                  <Label htmlFor="language">Filtrar por Idioma</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {uniqueLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang === 'all' ? 'Todos los idiomas' : lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">Cargando productos...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Idioma</TableHead>
                        <TableHead>Precio Cardmarket</TableHead>
                        <TableHead>Última Actualización</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No se encontraron productos
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map(product => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="relative w-10 h-10 overflow-hidden">
                                <ProductImage 
                                  src={product.imageUrl} 
                                  alt={product.name || 'Producto'} 
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.type || 'Sin tipo'}</TableCell>
                            <TableCell>{product.language || 'es'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-24"
                                  defaultValue={product.cardmarketPrice?.toString() || '0'}
                                  onBlur={(e) => {
                                    const newPrice = parseFloat(e.target.value);
                                    if (!isNaN(newPrice) && product.id && 
                                        newPrice !== product.cardmarketPrice) {
                                      handlePriceUpdate(product.id, newPrice);
                                    }
                                  }}
                                />
                                <span>€</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.lastPriceUpdate 
                                ? new Date(product.lastPriceUpdate.seconds * 1000).toLocaleString() 
                                : 'Nunca'}
                            </TableCell>
                            <TableCell>
                              {product.cardmarketUrl && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(product.cardmarketUrl, '_blank')}
                                >
                                  Ver en Cardmarket
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Actualización Masiva de Precios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Utiliza esta herramienta para actualizar múltiples precios a la vez. 
                Introduce los datos en el formato: ID_PRODUCTO,PRECIO (un producto por línea).
              </p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Actualización Masiva</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Actualización Masiva de Precios</DialogTitle>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Label htmlFor="bulkUpdate">
                      Introduce los datos en formato: ID_PRODUCTO,PRECIO (un producto por línea)
                    </Label>
                    <Textarea
                      id="bulkUpdate"
                      className="mt-2 h-40"
                      placeholder="ID1,10.99&#10;ID2,5.50&#10;ID3,7.25"
                      value={bulkUpdateText}
                      onChange={(e) => setBulkUpdateText(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleBulkUpdate}>
                      Actualizar Precios
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Productos sin precio de Cardmarket</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Idioma</TableHead>
                        <TableHead>ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            Cargando productos...
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.filter(p => !p.cardmarketPrice || p.cardmarketPrice === 0).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Todos los productos tienen precio de Cardmarket
                            </TableCell>
                          </TableRow>
                        ) : (
                          products
                            .filter(p => !p.cardmarketPrice || p.cardmarketPrice === 0)
                            .map(product => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="relative w-10 h-10 overflow-hidden">
                                    <ProductImage 
                                      src={product.imageUrl} 
                                      alt={product.name || 'Producto'} 
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.type || 'Sin tipo'}</TableCell>
                                <TableCell>{product.language || 'es'}</TableCell>
                                <TableCell>
                                  <code className="bg-gray-100 p-1 rounded">{product.id}</code>
                                </TableCell>
                              </TableRow>
                            ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 