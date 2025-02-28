import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/prices - Obtener todos los precios
export async function GET() {
  try {
    const prices = await prisma.price.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            language: true,
            type: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error al obtener precios:', error);
    return NextResponse.json(
      { error: 'Error al obtener precios' },
      { status: 500 }
    );
  }
}

// POST /api/prices - Crear un nuevo precio
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validación básica
    if (!data.productId) {
      return NextResponse.json(
        { error: 'El producto es obligatorio' },
        { status: 400 }
      );
    }
    
    if (!data.supplierId) {
      return NextResponse.json(
        { error: 'El proveedor es obligatorio' },
        { status: 400 }
      );
    }
    
    if (data.price === undefined || data.price === null || isNaN(parseFloat(data.price))) {
      return NextResponse.json(
        { error: 'El precio es obligatorio y debe ser un número' },
        { status: 400 }
      );
    }
    
    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'El producto no existe' },
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
    
    const price = await prisma.price.create({
      data: {
        price: parseFloat(data.price),
        currency: data.currency || 'JPY',
        priceUnit: data.priceUnit || 'Per Box',
        bulkPrice: data.bulkPrice ? parseFloat(data.bulkPrice) : null,
        shipping: data.shipping ? parseFloat(data.shipping) : null,
        notes: data.notes || null,
        productId: data.productId,
        supplierId: data.supplierId,
      },
    });
    
    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    console.error('Error al crear precio:', error);
    return NextResponse.json(
      { error: 'Error al crear precio' },
      { status: 500 }
    );
  }
} 