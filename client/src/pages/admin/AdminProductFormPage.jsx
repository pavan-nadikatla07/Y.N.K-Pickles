import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Upload,
  ChevronLeft,
  Save,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  Info,
  Scale
} from 'lucide-react';
import { formatCurrency, calculateItemSubtotal } from '../../utils/pricing.js';

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('kg');
  const [price, setPrice] = useState('');
  const [priceBasis, setPriceBasis] = useState('1');
  const [priceBasisUnit, setPriceBasisUnit] = useState('1kg');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minPurchaseQty, setMinPurchaseQty] = useState('1');
  const [purchaseIncrement, setPurchaseIncrement] = useState('1');
  const [isActive, setIsActive] = useState(true);

  // Image handling: File upload or existing URL
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Auto-sync basis defaults when measurementUnit changes
  const handleUnitChange = (unit) => {
    setMeasurementUnit(unit);
    if (unit === 'kg') {
      setPriceBasis('1');
      setPriceBasisUnit('1kg');
      setMinPurchaseQty('1');
      setPurchaseIncrement('1');
    } else if (unit === 'g') {
      setPriceBasis('100');
      setPriceBasisUnit('100g');
      setMinPurchaseQty('100');
      setPurchaseIncrement('100');
    } else if (unit === 'piece') {
      setPriceBasis('1');
      setPriceBasisUnit('piece');
      setMinPurchaseQty('1');
      setPurchaseIncrement('1');
    }
  };

  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        try {
          setFetching(true);
          // Use protected admin endpoint so even inactive/archived products load successfully
          const data = await api.getAdminProductById(id);
          if (data.success && data.product) {
            const p = data.product;
            setName(p.name || '');
            setDescription(p.description || '');
            setMeasurementUnit(p.measurementUnit || 'kg');
            setPrice(p.price !== undefined && p.price !== null ? p.price.toString() : '');
            setPriceBasis((p.priceBasis || 1).toString());
            setPriceBasisUnit(
              p.priceBasisUnit ||
                (p.measurementUnit === 'kg'
                  ? '1kg'
                  : p.measurementUnit === 'g'
                  ? '100g'
                  : 'piece')
            );
            setStockQuantity((p.stockQuantity !== undefined ? p.stockQuantity : 0).toString());
            setMinPurchaseQty((p.minPurchaseQty || 1).toString());
            setPurchaseIncrement((p.purchaseIncrement || 1).toString());
            setIsActive(p.isActive !== false);
            setImagePreview(p.imageUrl || '');
          }
        } catch (err) {
          error(err.message || 'Could not load product details from database.');
          navigate('/admin/products');
        } finally {
          setFetching(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        error('Please select a valid image file (JPEG, PNG, or WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        error('Image size must be under 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Product name is required.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      error('Please enter a valid positive price greater than 0.');
      return;
    }

    const parsedBasis = parseFloat(priceBasis);
    if (isNaN(parsedBasis) || parsedBasis <= 0) {
      error('Price basis quantity must be greater than 0.');
      return;
    }

    const parsedStock = parseFloat(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      error('Stock quantity cannot be negative.');
      return;
    }

    if (!isEdit && !imageFile && !imagePreview) {
      error('Product image is required.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('measurementUnit', measurementUnit);
      formData.append('price', parsedPrice.toString());
      formData.append('priceBasis', parsedBasis.toString());
      formData.append('priceBasisUnit', priceBasisUnit.trim() || measurementUnit);
      formData.append('stockQuantity', parsedStock.toString());
      formData.append('minPurchaseQty', minPurchaseQty.toString());
      formData.append('purchaseIncrement', purchaseIncrement.toString());
      formData.append('isActive', isActive);

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview) {
        formData.append('imageUrl', imagePreview);
      }

      let res;
      if (isEdit) {
        res = await api.updateProduct(id, formData);
      } else {
        res = await api.createProduct(formData);
      }

      if (res.success) {
        success(
          isEdit
            ? `Changes to "${name.trim()}" saved to MongoDB successfully!`
            : `New pickle product "${name.trim()}" created successfully!`
        );
        navigate('/admin/products');
      }
    } catch (err) {
      error(err.message || 'Failed to save product changes to database.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-24 text-center text-xs text-stone-400">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Retrieving product details from MongoDB...</span>
      </div>
    );
  }

  // Live calculation preview
  const sampleCalcUnit =
    measurementUnit === 'kg' ? 2 : measurementUnit === 'g' ? 500 : 3;
  const sampleProduct = {
    price: parseFloat(price) || 0,
    priceBasis: parseFloat(priceBasis) || 1,
    measurementUnit
  };
  const sampleSubtotal = calculateItemSubtotal(sampleProduct, sampleCalcUnit);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-800 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Products Catalog</span>
      </Link>

      {/* Main Form Container (Agrinex Card Layout) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white border-b border-stone-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
              {isEdit ? 'Product Editor' : 'New Catalog Item'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
            {isEdit ? `Edit Product: ${name || 'Pickle Item'}` : 'Add New South Indian Pickle'}
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            Configure authoritative pricing in rupees, packaging units, stock quantities, and marketplace visibility.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>General Information</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Traditional Avakaya Mango Pickle"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Description & Ingredients
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe pickle varieties, oil types (e.g. cold-pressed gingelly oil), spices, and taste notes..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Media & Imagery */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-900 font-bold text-sm">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>Product Photography</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-2xl object-cover bg-stone-100 border border-stone-300 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-stone-200/70 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  id="productImageUpload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="productImageUpload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold cursor-pointer transition shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>{imagePreview ? 'Replace Image' : 'Choose Pickle Photo'}</span>
                </label>
                <p className="text-[11px] text-stone-500">
                  Supported: JPEG, PNG, WebP (under 5MB). High-resolution authentic food imagery is recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Measurement Unit Selector */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-900 font-bold text-sm">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Packaging & Measurement Unit</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Measurement Basis *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'kg', label: 'Kilograms', sub: '(e.g. 1 kg)' },
                  { id: 'g', label: 'Grams', sub: '(e.g. 100g, 250g)' },
                  { id: 'piece', label: 'Piece / Jar', sub: '(e.g. 1 jar)' }
                ].map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleUnitChange(u.id)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-left ${
                      measurementUnit === u.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-950/20'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-extrabold">{u.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        measurementUnit === u.id ? 'text-amber-100' : 'text-stone-400'
                      }`}
                    >
                      {u.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Authoritative Pricing Engine */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-900 font-bold text-sm">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>Pricing Engine (INR ₹)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 350"
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Authoritative unit price</p>
              </div>

              {/* Price Basis Quantity */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Basis Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={priceBasis}
                  onChange={(e) => setPriceBasis(e.target.value)}
                  placeholder="e.g. 100 for 100g, 1 for kg"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">Quantity basis for this price</p>
              </div>

              {/* Price Basis Unit Label */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Price Basis Unit Label *
                </label>
                <input
                  type="text"
                  value={priceBasisUnit}
                  onChange={(e) => setPriceBasisUnit(e.target.value)}
                  placeholder="e.g. 1kg, 100g, piece"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">Displayed to customer (e.g. 1kg)</p>
              </div>
            </div>

            {/* Dynamic Live Customer Preview Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-stone-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Marketplace Customer Display & Calculation Preview</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div>
                  <span className="text-stone-500">Catalog Price Tag: </span>
                  <strong className="text-stone-900 text-sm font-black">
                    {formatCurrency(parseFloat(price) || 0)} per {priceBasisUnit || measurementUnit}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Sample Cart Order ({sampleCalcUnit} {measurementUnit}): </span>
                  <strong className="text-emerald-800 text-sm font-black">
                    {formatCurrency(sampleSubtotal)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Inventory & Purchase Increments */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-900 font-bold text-sm">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Stock & Order Quantities</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Available Stock ({measurementUnit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">Available in kitchen storage</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Min Purchase Qty ({measurementUnit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={minPurchaseQty}
                  onChange={(e) => setMinPurchaseQty(e.target.value)}
                  placeholder="e.g. 1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">Minimum order threshold</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Purchase Step ({measurementUnit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={purchaseIncrement}
                  onChange={(e) => setPurchaseIncrement(e.target.value)}
                  placeholder="e.g. 1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">Step amount on [+] / [-] buttons</p>
              </div>
            </div>
          </div>

          {/* Section 6: Marketplace Visibility */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-900 text-xs">
                  Marketplace Status
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  When enabled, customers can discover and purchase this pickle on the storefront.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2.5 text-xs font-bold text-stone-700">
                  {isActive ? 'Active' : 'Hidden'}
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Link
              to="/admin/products"
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-950/20 border border-amber-500/30 transition active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>
                {loading
                  ? 'Saving to MongoDB...'
                  : isEdit
                  ? 'Update Product & Save to Database'
                  : 'Create Pickle Product'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
