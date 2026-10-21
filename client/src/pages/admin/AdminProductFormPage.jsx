import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Upload, ChevronLeft, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';

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
          const data = await api.getProductById(id);
          if (data.success && data.product) {
            const p = data.product;
            setName(p.name);
            setDescription(p.description || '');
            setMeasurementUnit(p.measurementUnit || 'kg');
            setPrice(p.price.toString());
            setPriceBasis((p.priceBasis || 1).toString());
            setPriceBasisUnit(p.priceBasisUnit || '');
            setStockQuantity((p.stockQuantity || 0).toString());
            setMinPurchaseQty((p.minPurchaseQty || 1).toString());
            setPurchaseIncrement((p.purchaseIncrement || 1).toString());
            setIsActive(p.isActive !== false);
            setImagePreview(p.imageUrl);
          }
        } catch (err) {
          error(err.message || 'Could not load product details.');
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

    if (!price || parseFloat(price) < 0) {
      error('Please enter a valid price.');
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
      formData.append('price', price);
      formData.append('priceBasis', priceBasis);
      formData.append('priceBasisUnit', priceBasisUnit);
      formData.append('stockQuantity', stockQuantity);
      formData.append('minPurchaseQty', minPurchaseQty);
      formData.append('purchaseIncrement', purchaseIncrement);
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
        success(isEdit ? 'Product updated successfully.' : 'New product created successfully.');
        navigate('/admin/products');
      }
    } catch (err) {
      error(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-16 text-center text-xs text-gray-400">
        Loading product information...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-display font-black text-gray-900 mb-1">
          {isEdit ? 'Edit Product' : 'Add New Pickle Product'}
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Provide accurate pricing, measurement units, and stock quantities.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Traditional Avakaya Mango Pickle"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ingredients, spice blend, and oil used..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Image *
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-2xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File (JPEG/PNG/WebP)</span>
                </label>
                <p className="text-[11px] text-gray-400 mt-1">
                  Upload high quality pickle imagery under 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Measurement Unit Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Measurement Unit *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'kg', label: 'Kilograms (kg)' },
                { id: 'g', label: 'Grams (g)' },
                { id: 'piece', label: 'Piece / Jar (piece)' }
              ].map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleUnitChange(u.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                    measurementUnit === u.id
                      ? 'bg-olive-800 text-white border-olive-800 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Basis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 300"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Price Basis Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={priceBasis}
                onChange={(e) => setPriceBasis(e.target.value)}
                placeholder="e.g. 100 for 100g, 1 for kg"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                e.g. 100 means price is per 100 {measurementUnit}.
              </p>
            </div>
          </div>

          {/* Available Stock & Purchase Increments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Available Stock ({measurementUnit}) *
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Purchase Increment ({measurementUnit})
              </label>
              <input
                type="number"
                min="1"
                value={purchaseIncrement}
                onChange={(e) => setPurchaseIncrement(e.target.value)}
                placeholder="e.g. 100"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 font-mono"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-mango-600 focus:ring-mango-500"
              />
              <span className="text-xs font-bold text-gray-800">
                Active & Visible on Customer Marketplace
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              to="/admin/products"
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mango-600 hover:bg-mango-700 disabled:opacity-50 text-white text-xs font-bold shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
