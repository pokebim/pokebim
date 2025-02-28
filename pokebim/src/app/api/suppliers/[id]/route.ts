import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/suppliers/[id] - Obtener un proveedor específico
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        prices: true,
      },
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
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validación básica
    if (!data.name) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es obligatorio' },
        { status: 400 }
      );
    }
    
    // Verificar si el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
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
      data: {
        name: data.name,
        contact: data.contact || null,
        website: data.website || null,
        notes: data.notes || null,
      },
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
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Verificar si el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        prices: true,
      },
    });
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si tiene productos o precios asociados
    if (existingSupplier.products.length > 0 || existingSupplier.prices.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor con productos o precios asociados' },
        { status: 400 }
      );
    }
    
    // Eliminar proveedor
    await prisma.supplier.delete({
      where: { id },
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