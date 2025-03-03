import { NextResponse } from 'next/server';
import { createPokemonLinksGroup } from '@/scripts/createPokemonLinks';

// La API route para ejecutar el script
export async function GET() {
  try {
    // Ejecutar el script
    const result = await createPokemonLinksGroup();

    // Devolver respuesta
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error al ejecutar el script:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    );
  }
} 