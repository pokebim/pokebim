'use client';

import MainLayout from '@/components/layout/MainLayout';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
} 