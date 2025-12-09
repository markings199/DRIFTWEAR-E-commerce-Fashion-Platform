const Product = require('../models/Product');

// Get all products with optional filtering
const getProducts = async (req, res) => {
  try {
    const { category, featured, onSale, page = 1, limit = 12, sort = 'createdAt' } = req.query;
    
    // Build filter object
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured) filter.featured = featured === 'true';
    if (onSale) filter.onSale = onSale === 'true';
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get products with filter, sort, and pagination
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
};

// Create new product (admin only)
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching featured products' });
  }
};

// Get products on sale
const getSaleProducts = async (req, res) => {
  try {
    const products = await Product.find({ onSale: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sale products' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getSaleProducts
};