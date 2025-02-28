import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/[id] - Obtener un producto específico
export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        prices: {
          include: {
            supplier: true,
          },
        },
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Actualizar un producto
export async function PUT(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const data = await request.json();
    
    // Validación básica
    if (!data.name) {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }
    
    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }
    
    // Si se proporciona un nuevo supplierId, verificar que el proveedor existe
    if (data.supplierId && data.supplierId !== existingProduct.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'El proveedor no existe' },
          { status: 400 }
        );
      }
    }
    
    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        language: data.language || existingProduct.language,
        type: data.type !== undefined ? data.type : existingProduct.type,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingProduct.imageUrl,
        description: data.description !== undefined ? data.description : existingProduct.description,
        supplierId: data.supplierId || existingProduct.supplierId,
      },
    });
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Eliminar un producto
export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        prices: true,
      },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si hay precios asociados a este producto
    const associatedPrices = await prisma.price.findMany({
      where: { productId: id }
    });
    
    if (associatedPrices.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el producto porque tiene precios asociados' },
        { status: 400 }
      );
    }
    
    // Eliminar producto
    await prisma.product.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
} 