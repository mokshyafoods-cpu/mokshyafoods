'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import Button from '@/components/Button';
import { categoryAPI, productAPI } from '@/services/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isMobileDevice } from '@/lib/utils';

const placeholder = '/placeholder.jpg';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    discountPrice: '',
    onSale: false,
    saleStart: '',
    saleEnd: '',
    quantity: '',
    weight: '',
    packaging: '',
    packagesInStock: '',
    tags: '',
    isActive: true,
  });
  const [otherCategory, setOtherCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryResponse, productResponse] = await Promise.all([
          categoryAPI.getAll(),
          productAPI.getById(id, { includeInactive: true }),
        ]);
        const categoryPayload = categoryResponse?.data?.data ?? categoryResponse?.data ?? [];
        setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
        const productData = productResponse?.data?.data ?? productResponse?.data ?? null;
        setProduct(productData);
        const categoryValue = productData?.category?._id || productData?.category?.id || productData?.category?.slug || productData?.category?.name || productData?.category || '';
        const categoryId = typeof categoryValue === 'string' ? categoryValue : '';
        setFormData({
          name: productData?.name || '',
          sku: productData?.sku || '',
          description: productData?.description || '',
          category: categoryId,
          price: productData?.price?.toString() || '',
          discountPrice: productData?.discountPrice?.toString() || '',
          onSale: !!productData?.onSale,
          saleStart: productData?.saleStart ? new Date(productData.saleStart).toISOString().slice(0, 16) : '',
          saleEnd: productData?.saleEnd ? new Date(productData.saleEnd).toISOString().slice(0, 16) : '',
          quantity: productData?.quantity?.toString() || '',
          weight: productData?.weight?.toString() || '',
          packaging: productData?.packaging || '',
          packagesInStock: productData?.packagesInStock?.toString() || '',
          tags: JSON.stringify(productData?.tags || []),
          isActive: productData?.isActive !== false,
        });
        setOtherCategory(categoryId === 'other' ? '' : categoryId);
        setError('');
      } catch (err: any) {
        console.error('Failed to load product data', err);
        setError(err.response?.data?.message || 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isMobileDevice()) {
      toast.error('Image uploads are not allowed on mobile devices.');
      return;
    }

    const files = event.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 5);
    setImages(selected);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    const trimmedName = formData.name?.trim();
    const trimmedSku = formData.sku?.trim();
    const trimmedDescription = formData.description?.trim();
    const categoryValue = formData.category === 'other' ? otherCategory.trim() : formData.category?.trim();

    if (!trimmedName || !trimmedSku || !trimmedDescription || !categoryValue) {
      toast.error('Please complete the required product fields before saving.');
      return;
    }

    if (formData.price !== '' && Number(formData.price) < 0) {
      toast.error('Price must be a valid number.');
      return;
    }

    setSaving(true);
    try {
      const submitData = new FormData();
      const appendIfPresent = (key: string, value: any) => {
        if (value === undefined || value === null || value === '') return;
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
        submitData.append(key, val);
      };

      appendIfPresent('name', trimmedName);
      appendIfPresent('sku', trimmedSku);
      appendIfPresent('description', trimmedDescription);
      appendIfPresent('category', categoryValue);
      appendIfPresent('price', formData.price);
      appendIfPresent('discountPrice', formData.discountPrice);
      appendIfPresent('quantity', formData.quantity);
      appendIfPresent('weight', formData.weight);
      appendIfPresent('packaging', formData.packaging);
      appendIfPresent('packagesInStock', formData.packagesInStock);
      appendIfPresent('tags', formData.tags || '[]');
      if (formData.onSale) {
        submitData.set('onSale', 'true');
        if (formData.saleStart) submitData.set('saleStart', formData.saleStart);
        if (formData.saleEnd) submitData.set('saleEnd', formData.saleEnd);
      } else {
        submitData.set('onSale', 'false');
      }
      submitData.set('isActive', formData.isActive ? 'true' : 'false');

      if (images.length > 0) {
        images.forEach((file) => submitData.append('images', file));
      }

      await productAPI.update(id, submitData);
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Failed to update product', err);
      toast.error(err.response?.data?.message || 'Unable to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex min-h-[60vh] items-center justify-center py-20">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
            <p className="text-lg text-slate-700">Loading product...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex min-h-[60vh] items-center justify-center py-20">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 shadow-xl text-red-700">
            <p className="text-lg font-semibold">{error}</p>
            <Link href="/admin/products" className="mt-4 inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">
              Back to Products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)'}}>
      <main className="mx-auto flex max-w-5xl flex-col">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b7a2f]">Edit Product</p>
              <h1 className="mt-2 text-4xl font-semibold text-[#1b3a2b]">{product.name}</h1>
            </div>
            <Link href="/admin/products" className="inline-flex items-center rounded-full border border-[#d8caa7] bg-[#fbf7ec] px-5 py-3 text-sm font-semibold text-[#1b3a2b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4ebd8]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[#d8caa7]/80 bg-white/90 p-8 shadow-[0_30px_90px_rgba(27,58,43,0.16)] backdrop-blur-xl">
            <div className="grid gap-6 md:grid-cols-2">
              <FormInput
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-semibold text-slate-800">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-[#9b7a2f] focus:ring-2 focus:ring-[#9b7a2f]/20"
                  required
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
                {formData.category === 'other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-600 focus:border-[#9b7a2f] focus:ring-2 focus:ring-[#9b7a2f]/20"
                    />
                  </div>
                )}
              </div>
              <FormInput
                label="Price (Rs)"
                name="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <FormInput
                label="Discount Price (optional)"
                name="discountPrice"
                type="number"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
              />

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!formData.onSale}
                    onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                    className="h-4 w-4 rounded border-[#d8caa7] text-[#1b3a2b] focus:ring-[#9b7a2f]"
                  />
                  <span>On sale (schedule)</span>
                </label>

                {formData.onSale && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Sale start</label>
                      <input
                        type="datetime-local"
                        value={formData.saleStart}
                        onChange={(e) => setFormData({ ...formData, saleStart: e.target.value })}
                        className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a2f]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Sale end</label>
                      <input
                        type="datetime-local"
                        value={formData.saleEnd}
                        onChange={(e) => setFormData({ ...formData, saleEnd: e.target.value })}
                        className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a2f]/20"
                      />
                    </div>
                  </div>
                )}
              </div>
              <FormInput
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <FormInput
                label="Weight (grams)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
              <FormInput
                label="Packages in stock"
                name="packagesInStock"
                type="number"
                value={formData.packagesInStock}
                onChange={(e) => setFormData({ ...formData, packagesInStock: e.target.value })}
              />
              <FormInput
                label="Packaging"
                name="packaging"
                value={formData.packaging}
                onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
              />
            </div>

            <FormTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
            />

            <div className="space-y-4 rounded-[1.25rem] border border-[#d8caa7]/70 bg-[#fbf7ec] p-4 shadow-sm">
              <label className="block text-sm font-semibold text-slate-800">Existing image</label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={product.thumbnail || product.images?.[0]?.url || placeholder}
                  alt={product.name}
                  className="h-28 w-28 rounded-3xl object-cover shadow-sm"
                />
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Upload new images to replace the current ones.</p>
                  <p className="text-xs font-medium text-slate-500">Max 5 images, JPG/PNG/GIF/WebP.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-3 shadow-sm">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full cursor-pointer text-sm font-medium text-slate-800 file:mr-3 file:rounded-full file:border-0 file:bg-[#1b3a2b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm" />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#d8caa7]/80 bg-[#fbf7ec] px-4 py-3 shadow-sm">
              <input
                id="isActive"
                type="checkbox"
                checked={!!formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-[#d8caa7] text-[#1b3a2b] focus:ring-[#9b7a2f]"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-800">
                Show this product to customers
              </label>
            </div>

            <FormTextarea
              label="Tags (JSON array)"
              name="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              rows={3}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" loading={saving} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/products')} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
