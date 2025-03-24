import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle the multipart form data manually
    responseLimit: '10mb',
  },
};

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

    // Get the desired size from the query parameters or use default
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1] || '');
    const size = parseInt(urlSearchParams.get('size') || '150', 10);
    
    // Get buffer from file
    const buffer = await file.arrayBuffer();
    
    // Process the image with sharp
    const processedImageBuffer = await sharp(Buffer.from(buffer))
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .toFormat('jpeg', { quality: 85 })
      .toBuffer();

    // Create a unique filename for the processed image
    const originalFilename = file.name;
    const extension = originalFilename.split('.').pop();
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    const thumbnailFilename = `wp-thumb-${timestamp}-${uuid}.jpg`;

    // Return the processed image as a response with appropriate headers
    return new NextResponse(processedImageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
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