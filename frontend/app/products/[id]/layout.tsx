import type { Metadata } from 'next';
import { buildProductMetadata } from '@/lib/seo';
import { productAPI } from '@/services/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await productAPI.getById(id);
    const payload = response?.data?.data ?? response?.data ?? null;
    const product = payload && typeof payload === 'object' ? payload : null;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mokshyafoods.com'}/products/${id}`;

    if (!product) {
      return buildProductMetadata(null, url);
    }

    return buildProductMetadata(product, url);
  } catch {
    return buildProductMetadata(null, `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mokshyafoods.com'}/products/${id}`);
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
