import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/suppliers/[id] - Obtener un proveedor específico
export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedor' },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Actualizar un proveedor
export async function PUT(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const data = await request.json();
    
    // Verificar si el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar proveedor
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data
    });
    
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Eliminar un proveedor
export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Verificar si el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si hay precios asociados a este proveedor
    const associatedPrices = await prisma.price.findMany({
      where: { supplierId: id }
    });
    
    if (associatedPrices.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el proveedor porque tiene precios asociados' },
        { status: 400 }
      );
    }
    
    // Eliminar proveedor
    await prisma.supplier.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
} 