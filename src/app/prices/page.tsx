'use client';

import { useSearchParams } from 'next/navigation';
import PricesContent from './pricesContent';
import MainLayout from '@/components/layout/MainLayout';

export default function PricesPage() {
  const searchParams = useSearchParams();
  const supplierFilter = searchParams.get('supplier');

  return (
    <MainLayout>
      <div className="flex-1 h-full">
        <PricesContent initialSupplierFilter={supplierFilter} />
      </div>
    </MainLayout>
  );
} 