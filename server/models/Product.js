import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true
    },
    measurementUnit: {
      type: String,
      enum: ['kg', 'g', 'piece'],
      required: [true, 'Measurement unit is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    priceBasis: {
      type: Number,
      required: [true, 'Price basis is required'],
      min: [1, 'Price basis must be at least 1'],
      default: 1
    },
    priceBasisUnit: {
      type: String,
      trim: true,
      default: '1kg'
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    minPurchaseQty: {
      type: Number,
      min: [0.001, 'Minimum purchase quantity must be positive'],
      default: 1
    },
    purchaseIncrement: {
      type: Number,
      min: [0.001, 'Purchase increment must be positive'],
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isStockAvailable: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Keep isStockAvailable in sync with stockQuantity
productSchema.pre('save', function (next) {
  this.isStockAvailable = this.stockQuantity > 0;
  next();
});

export const Product = mongoose.model('Product', productSchema);
