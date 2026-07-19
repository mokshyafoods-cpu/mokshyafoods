'use client';

import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import Button from '@/components/Button';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, categoryAPI } from '@/services/api';

const defaultTagOptions = ['organic', 'premium', 'dried', 'gluten-free', 'handpicked', 'fresh', 'seasonal'];
const fallbackCategoryOptions = [
  { label: 'Dried Fruits', value: 'dried-fruits' },
  { label: 'Dried Vegetables', value: 'dried-vegetables' },
  { label: 'Dry Nuts', value: 'dry-nuts' },
  { label: 'Seeds', value: 'seeds' },
  { label: 'Organic Products', value: 'organic-products' },
  { label: 'Bulk Orders', value: 'bulk-orders' },
  { label: 'Other', value: 'other' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
    isActive: true,
  });
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otherCategory, setOtherCategory] = useState('');
  const [serverError, setServerError] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        setCategories(response?.data ?? response ?? []);
        setBackendAvailable(true);
      } catch (error) {
        console.error('Category fetch failed', error);
        setBackendAvailable(false);
      }
    };
    loadCategories();
  }, []);

  const tagSuggestions = useMemo(() => defaultTagOptions.filter((tag) => !selectedTags.includes(tag)), [selectedTags]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.category === 'other' && !otherCategory.trim()) newErrors.category = 'Please enter a custom category';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (formData.discountPrice && Number(formData.discountPrice) >= Number(formData.price)) newErrors.discountPrice = 'Discount price must be less than the regular price';
    if (formData.onSale) {
      if (!formData.discountPrice) newErrors.discountPrice = 'Discount price is required when product is on sale';
      if (formData.saleStart && formData.saleEnd && new Date(formData.saleEnd) < new Date(formData.saleStart)) newErrors.saleEnd = 'Sale end must be after start';
    }
    if (!formData.quantity || Number(formData.quantity) < 0) newErrors.quantity = 'Valid stock quantity is required';
    if (!formData.weight || Number(formData.weight) <= 0) newErrors.weight = 'Weight in grams is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setImages((prev) => [...prev, ...newFiles].slice(0, 5));
      setErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setServerError('');
    setLoading(true);

    let timeoutId: number | undefined;
    timeoutId = window.setTimeout(() => {
      setLoading(false);
      setServerError('The request is still taking longer than expected. Please wait a moment and try again if it does not finish.');
      toast.error('The request is still taking longer than expected.');
    }, 180000);

    try {
      const submitData = new FormData();
      const appendIfPresent = (key: string, value: string) => {
        if (value === undefined || value === null || value === '') return;
        submitData.append(key, value);
      };

      appendIfPresent('name', formData.name);
      appendIfPresent('sku', formData.sku);
      appendIfPresent('description', formData.description);
      appendIfPresent('category', formData.category === 'other' ? otherCategory : formData.category);
      appendIfPresent('price', formData.price);
      appendIfPresent('discountPrice', formData.discountPrice);
      if (formData.onSale) {
        appendIfPresent('onSale', 'true');
        appendIfPresent('saleStart', formData.saleStart);
        appendIfPresent('saleEnd', formData.saleEnd);
      } else {
        appendIfPresent('onSale', 'false');
      }
      appendIfPresent('quantity', formData.quantity);
      appendIfPresent('packagesInStock', formData.packagesInStock);
      appendIfPresent('weight', formData.weight);
      appendIfPresent('packaging', formData.packaging);
      appendIfPresent('tags', JSON.stringify(selectedTags));
      appendIfPresent('isActive', formData.isActive ? 'true' : 'false');

      images.forEach((image) => {
        submitData.append('images', image);
      });

      await api.post('/products', submitData);

      toast.success('Product created successfully!');
      if (timeoutId) window.clearTimeout(timeoutId);
      setLoading(false);
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Create product failed', error.response?.data || error.message || error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error?.message || 'Failed to create product';
      const validationMessage = Array.isArray(errorData?.errors)
        ? errorData.errors.map((item: any) => item?.msg).filter(Boolean).join(', ')
        : '';
      const finalMessage = validationMessage || errorMessage;
      setServerError(finalMessage);
      toast.error(finalMessage);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)'}}>
      <main className="mx-auto flex max-w-4xl flex-col">
        <div className="rounded-[2rem] border border-[#d8caa7]/80 bg-white/90 p-8 shadow-[0_30px_90px_rgba(27,58,43,0.16)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b7a2f]">Catalog</p>
            <h1 className="text-3xl font-bold text-[#1b3a2b]">Create New Product</h1>
            <p className="text-sm text-slate-600">Add premium products with richer pricing, stock, and content details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />

              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                error={errors.sku}
                required
              />

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-semibold text-slate-800">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-[#9b7a2f] focus:ring-2 focus:ring-[#9b7a2f]/20"
                >
                  <option value="">Choose category</option>
                  {categories.length > 0
                    ? categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))
                    : fallbackCategoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
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
                      className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-[#9b7a2f] focus:ring-2 focus:ring-[#9b7a2f]/20"
                    />
                  </div>
                )}
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <FormInput
                label="Price (Rs)"
                name="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={errors.price}
                required
              />

              <FormInput
                label="Discount Price (optional)"
                name="discountPrice"
                type="number"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                error={errors.discountPrice}
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
                      {errors.saleStart && <p className="text-xs text-red-500">{errors.saleStart}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Sale end</label>
                      <input
                        type="datetime-local"
                        value={formData.saleEnd}
                        onChange={(e) => setFormData({ ...formData, saleEnd: e.target.value })}
                        className="w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9b7a2f]/20"
                      />
                      {errors.saleEnd && <p className="text-xs text-red-500">{errors.saleEnd}</p>}
                    </div>
                  </div>
                )}
              </div>

              <FormInput
                label="Quantity (units)"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                error={errors.quantity}
                required
              />

              <FormInput
                label="Weight (grams)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                error={errors.weight}
                required
              />

              <FormInput
                label="Packages in stock"
                name="packagesInStock"
                type="number"
                value={formData.packagesInStock}
                onChange={(e) => setFormData({ ...formData, packagesInStock: e.target.value })}
              />

              <FormInput
                label="Packaging details"
                name="packaging"
                value={formData.packaging}
                onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
              />
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
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={errors.description}
              required
              rows={5}
            />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">Tags</label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTags((prev) => prev.filter((item) => item !== tag))}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {tag}
                    <span className="text-slate-400">×</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTags((prev) => [...prev, tag])}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Choose tags from the list to make product discovery faster.</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-800">
                Product Images (Max 5) {images.length > 0 && `(${images.length} selected)`}
              </label>
              <div className="rounded-[1.25rem] border-2 border-dashed border-[#d8caa7] bg-[#fbf7ec] p-6 shadow-sm">
                <div className="rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-3 shadow-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={images.length >= 5}
                    className="w-full cursor-pointer text-sm font-medium text-slate-800 file:mr-3 file:rounded-full file:border-0 file:bg-[#1b3a2b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm"
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Supported formats: JPG, PNG, GIF, WebP. Max 5MB per image.
                </p>
              </div>
              {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {backendAvailable === false && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Backend server unavailable. Start the backend before creating a product.
              </div>
            )}

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {serverError}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} loading={loading} className="flex-1">
                Create Product
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
