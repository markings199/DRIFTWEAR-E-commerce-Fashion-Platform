const express = require('express');
const router = express.Router();

// Sample product data
const sampleProducts = [
  {
    id: '1',
    name: 'Cessati Linen Sinti',
    price: 44.99,
    description: 'Premium linen shirt',
    category: 'Shirts',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
    colors: ['Black', 'Blue', 'White'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: '2',
    name: 'Driftwear Hoodie',
    price: 59.99,
    description: 'Premium streetwear hoodie',
    category: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
    colors: ['Black', 'Gray', 'Red'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: '3',
    name: 'Streetwear Jeans',
    price: 79.99,
    description: 'Premium denim jeans',
    category: 'Pants',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
    colors: ['Blue', 'Black'],
    sizes: ['28', '30', '32', '34']
  }
];

// =============== PRODUCT ROUTES ===============

// Get all products
router.get('/', (req, res) => {
  try {
    console.log('🛍️ Getting all products...');
    
    res.json({
      success: true,
      products: sampleProducts,
      count: sampleProducts.length
    });
  } catch (error) {
    console.error('❌ Error getting products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    });
  }
});

// Get product by ID
router.get('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🛍️ Getting product ${productId}...`);
    
    const product = sampleProducts.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('❌ Error getting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product'
    });
  }
});

// Create product
router.post('/', (req, res) => {
  try {
    console.log('🛍️ Creating new product...');
    
    const newProduct = {
      id: `PROD${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🛍️ Updating product ${productId}...`);
    
    res.json({
      success: true,
      message: `Product ${productId} updated successfully`,
      product: {
        id: productId,
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🛍️ Deleting product ${productId}...`);
    
    res.json({
      success: true,
      message: `Product ${productId} deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// Search products
router.get('/search/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    console.log(`🔍 Searching products for: ${query}`);
    
    const filteredProducts = sampleProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
    
    res.json({
      success: true,
      products: filteredProducts,
      count: filteredProducts.length
    });
  } catch (error) {
    console.error('❌ Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

module.exports = router;