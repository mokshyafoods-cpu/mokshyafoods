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
  const [existingImages, setExistingImages] = useState<Array<{ url: string; _id?: string }>>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
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
        // Load existing images
        const images = productData?.images || [];
        setExistingImages(Array.isArray(images) ? images : []);
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
    const files = event.target.files;
    if (!files) return;
    const selected = Array.from(files);
    // Add new files to the new images list (up to 5 total images including existing)
    const totalImages = existingImages.length + newImages.length + selected.length;
    if (totalImages > 5) {
      toast.error(`Maximum 5 images allowed. You have ${existingImages.length + newImages.length} images.`);
      return;
    }
    setNewImages((prev) => [...prev, ...selected].slice(0, 5));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (!formData.price.trim()) {
      toast.error('Price is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!formData.quantity.trim()) {
      toast.error('Quantity is required');
      return;
    }
    
    if (!id) return;

    setSaving(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'category') {
          // FormData only accepts string or Blob; stringify non-blob values
          const val = value === null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
          submitData.append(key, val);
        }
      });
      // Ensure onSale, isActive, and dates are appended correctly (booleans as strings)
      submitData.set('onSale', formData.onSale ? 'true' : 'false');
      submitData.set('isActive', formData.isActive ? 'true' : 'false');
      if (formData.saleStart) submitData.set('saleStart', formData.saleStart);
      if (formData.saleEnd) submitData.set('saleEnd', formData.saleEnd);
      const categoryValue = formData.category === 'other' ? otherCategory : formData.category;
      if (categoryValue) {
        submitData.append('category', categoryValue);
      }

      // Send existing images URLs to preserve them
      const existingImageUrls = existingImages.map((img) => img.url);
      if (existingImageUrls.length > 0) {
        submitData.append('keepImages', JSON.stringify(existingImageUrls));
      }

      // Add only new images if any
      if (newImages.length > 0) {
        newImages.forEach((file) => submitData.append('images', file));
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

          <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-[2rem] border border-[#d8caa7]/80 bg-white/90 p-8 shadow-[0_30px_90px_rgba(27,58,43,0.16)] backdrop-blur-xl">
            <div className="grid gap-6 md:grid-cols-2">
              <FormInput
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-semibold text-slate-800">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-[#9b7a2f] focus:ring-2 focus:ring-[#9b7a2f]/20"
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
            />

            <div className="space-y-4 rounded-[1.25rem] border border-[#d8caa7]/70 bg-[#fbf7ec] p-4 shadow-sm">
              <label className="block text-sm font-semibold text-slate-800">Product Images</label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-600">Current images ({existingImages.length})</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Product ${index + 1}`}
                          className="h-24 w-full rounded-xl object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 hidden rounded-full bg-red-500 p-1 text-white shadow-md transition group-hover:flex hover:bg-red-600"
                          title="Remove image"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {newImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-600">New images to upload ({newImages.length})</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {newImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="h-24 w-full rounded-xl object-cover shadow-sm border-2 border-green-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 hidden rounded-full bg-red-500 p-1 text-white shadow-md transition group-hover:flex hover:bg-red-600"
                          title="Remove image"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-slate-600">Upload new images or manage existing ones</p>
                <p className="text-xs font-medium text-slate-500">Max 5 images total, JPG/PNG/GIF/WebP.</p>
              </div>
              <div className="rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-3 shadow-sm">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full cursor-pointer text-sm font-medium text-slate-800 file:mr-3 file:rounded-full file:border-0 file:bg-[#1b3a2b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm"
                />
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
              <Button type="submit" loading={saving} className="flex-1">
                Save changes
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
