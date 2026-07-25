export const slugify = (value: string | null | undefined) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const getProductSlug = (product: any, fallbackId?: string | null) => {
  const candidates = [
    product?.slug,
    product?.seoSlug,
    product?.urlSlug,
    product?.name,
    product?.title,
    product?.seoTitle,
  ];

  const slugFromCandidate = candidates.find((value) => typeof value === 'string' && value.trim());
  const slug = slugify(slugFromCandidate as string | null | undefined);

  if (slug) return slug;
  const fallback = typeof fallbackId === 'string' ? fallbackId.trim() : '';
  return fallback || String(product?._id || product?.id || '').trim();
};

export const getProductUrl = (product: any, fallbackId?: string | null) => {
  const slug = getProductSlug(product, fallbackId);
  return `/products/${encodeURIComponent(slug)}`;
};
