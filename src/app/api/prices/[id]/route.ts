import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/prices/[id] - Obtener un precio específico
export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    const price = await prisma.price.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
      },
    });
    
    if (!price) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(price);
  } catch (error) {
    console.error('Error al obtener precio:', error);
    return NextResponse.json(
      { error: 'Error al obtener precio' },
      { status: 500 }
    );
  }
}

// PUT /api/prices/[id] - Actualizar un precio
export async function PUT(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const data = await request.json();
    
    // Verificar si el precio existe
    const existingPrice = await prisma.price.findUnique({
      where: { id },
    });
    
    if (!existingPrice) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      );
    }
    
    // Validación básica
    if (data.price !== undefined && (data.price === null || isNaN(parseFloat(data.price)))) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }
    
    // Si se proporciona un nuevo productId, verificar que el producto existe
    if (data.productId && data.productId !== existingPrice.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });
      
      if (!product) {
        return NextResponse.json(
          { error: 'El producto no existe' },
          { status: 400 }
        );
      }
    }
    
    // Si se proporciona un nuevo supplierId, verificar que el proveedor existe
    if (data.supplierId && data.supplierId !== existingPrice.supplierId) {
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
    
    // Actualizar precio
    const updatedPrice = await prisma.price.update({
      where: { id },
      data: {
        price: data.price !== undefined ? parseFloat(data.price) : existingPrice.price,
        currency: data.currency || existingPrice.currency,
        priceUnit: data.priceUnit !== undefined ? data.priceUnit : existingPrice.priceUnit,
        bulkPrice: data.bulkPrice !== undefined ? (data.bulkPrice ? parseFloat(data.bulkPrice) : null) : existingPrice.bulkPrice,
        shipping: data.shipping !== undefined ? (data.shipping ? parseFloat(data.shipping) : null) : existingPrice.shipping,
        notes: data.notes !== undefined ? data.notes : existingPrice.notes,
        productId: data.productId || existingPrice.productId,
        supplierId: data.supplierId || existingPrice.supplierId,
      },
    });
    
    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error('Error al actualizar precio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar precio' },
      { status: 500 }
    );
  }
}

// DELETE /api/prices/[id] - Eliminar un precio
export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Verificar si el precio existe
    const existingPrice = await prisma.price.findUnique({
      where: { id },
    });
    
    if (!existingPrice) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      );
    }
    
    // Eliminar precio
    await prisma.price.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar precio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar precio' },
      { status: 500 }
    );
  }
} 