'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PricesContent from './pricesContent';
import MainLayout from '@/components/layout/MainLayout';

function PricesPageContent() {
  const searchParams = useSearchParams();
  const supplierFilter = searchParams.get('supplier');

  return (
    <div className="flex-1 h-full">
      <PricesContent initialSupplierFilter={supplierFilter} />
    </div>
  );
}

export default function PricesPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <PricesPageContent />
      </Suspense>
    </MainLayout>
  );
} 