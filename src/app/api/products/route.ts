import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products - Obtener todos los productos
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST /api/products - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validación básica
    if (!data.name) {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }
    
    if (!data.supplierId) {
      return NextResponse.json(
        { error: 'El proveedor es obligatorio' },
        { status: 400 }
      );
    }
    
    // Verificar si el proveedor existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'El proveedor no existe' },
        { status: 400 }
      );
    }
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        language: data.language || 'Japanese',
        type: data.type || null,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        supplierId: data.supplierId,
      },
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
} 