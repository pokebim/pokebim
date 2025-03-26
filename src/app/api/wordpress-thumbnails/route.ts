import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

// Updated to use the new route segment config format
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos para los parámetros de procesamiento de imágenes
type FitMode = 'contain' | 'cover';
type BgColor = 'white' | 'black' | 'transparent';

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Get parameters from the query string
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse and validate parameters
    const size = parseInt(searchParams.get('size') || '150', 10);
    const fit = (searchParams.get('fit') || 'contain') as FitMode;
    const bgColorParam = searchParams.get('bg') || 'white';
    
    // Determine background color
    let background: sharp.Color;
    
    if (bgColorParam === 'transparent') {
      // Transparente (para PNG)
      background = { r: 0, g: 0, b: 0, alpha: 0 };
    } else if (bgColorParam === 'black') {
      // Negro
      background = { r: 0, g: 0, b: 0, alpha: 1 };
    } else {
      // Blanco (por defecto)
      background = { r: 255, g: 255, b: 255, alpha: 1 };
    }
    
    // Get buffer from file
    const buffer = await file.arrayBuffer();
    
    // Create Sharp processor
    let processor = sharp(Buffer.from(buffer))
      .resize(size, size, {
        fit: fit,
        position: 'centre',
        background
      });
    
    // Set output format based on background
    let outputFormat: 'jpeg' | 'png' = 'jpeg';
    if (bgColorParam === 'transparent') {
      outputFormat = 'png';
    }
    
    // Process the image
    const processedImageBuffer = await processor
      .toFormat(outputFormat, { quality: 85 })
      .toBuffer();

    // Create a unique filename for the processed image
    const originalFilename = file.name;
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    const extension = outputFormat === 'png' ? 'png' : 'jpg';
    const thumbnailFilename = `wp-thumb-${timestamp}-${uuid}.${extension}`;

    // Return the processed image as a response with appropriate headers
    return new NextResponse(processedImageBuffer, {
      headers: {
        'Content-Type': outputFormat === 'png' ? 'image/png' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${thumbnailFilename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Error processing image', details: (error as Error).message },
      { status: 500 }
    );
  }
} 