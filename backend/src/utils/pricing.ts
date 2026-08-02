export interface ProductPricingInput {
  price?: number | string | null;
  discountPrice?: number | string | null;
  onSale?: boolean | string | null;
  saleStart?: Date | string | null;
  saleEnd?: Date | string | null;
}

export const getEffectiveProductPrice = (product: ProductPricingInput): number => {
  const basePrice = Number(product?.price ?? 0);
  const discountPrice = Number(product?.discountPrice ?? 0);
  const onSale = product?.onSale === true || product?.onSale === 'true';

  if (!onSale || !discountPrice) {
    return basePrice;
  }

  const now = new Date();
  const start = product?.saleStart ? new Date(product.saleStart) : null;
  const end = product?.saleEnd ? new Date(product.saleEnd) : null;

  if (start && now < start) {
    return basePrice;
  }

  if (end && now > end) {
    return basePrice;
  }

  return discountPrice;
};
