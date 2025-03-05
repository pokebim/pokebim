import { NextResponse } from 'next/server';
import { getCardmarketPrice } from '@/lib/cardmarketScraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const price = await getCardmarketPrice(url);
    
    if (price === null) {
      return NextResponse.json({ error: 'No price found' }, { status: 404 });
    }

    return NextResponse.json({ price });
  } catch (error) {
    console.error('Error in cardmarket-price route:', error);
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
} 