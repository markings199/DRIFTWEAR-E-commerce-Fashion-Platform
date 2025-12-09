import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  // All your products data
  const productsData = {
    women: [
      { id: 1, name: "Classic Fit T-Shirt", price: 29.99, oldPrice: 39.99, image: "/images/women1.jpeg", badge: "New", category: "women", stock: 50, status: "active" },
      { id: 2, name: "Slim Fit Jeans", price: 49.99, oldPrice: 59.99, image: "/images/women2.jpeg", category: "women", stock: 30, status: "active" },
      { id: 3, name: "Hooded Jacket", price: 79.99, oldPrice: 99.99, image: "/images/women3.jpeg", badge: "Sale", category: "women", stock: 20, status: "active" },
      { id: 4, name: "Casual Linen Shirt", price: 44.99, oldPrice: 54.99, image: "/images/women4.jpeg", category: "women", stock: 35, status: "active" },
      { id: 5, name: "Premium Denim Jacket", price: 89.99, oldPrice: 109.99, image: "/images/women5.jpeg", badge: "New", category: "women", stock: 15, status: "active" },
      { id: 6, name: "Classic Chino Pants", price: 39.99, oldPrice: 49.99, image: "/images/women6.jpeg", category: "women", stock: 40, status: "active" },
      { id: 7, name: "Premium Leather Belt", price: 34.99, oldPrice: 44.99, image: "/images/women7.jpeg", category: "women", stock: 60, status: "active" },
      { id: 8, name: "Sport Utility Shorts", price: 32.99, oldPrice: 42.99, image: "/images/women8.jpeg", badge: "Sale", category: "women", stock: 25, status: "active" },
      { id: 9, name: "Classic Oxford Shirt", price: 49.99, oldPrice: 59.99, image: "/images/women9.jpeg", category: "women", stock: 30, status: "active" },
      { id: 10, name: "Wool Blend Sweater", price: 69.99, oldPrice: 89.99, image: "/images/women10.jpeg", badge: "New", category: "women", stock: 18, status: "active" },
      { id: 11, name: "Women's Summer Dress", price: 54.99, oldPrice: 64.99, image: "/images/women11.jpeg", category: "women", stock: 22, status: "active" },
      { id: 12, name: "Women's Trench Coat", price: 129.99, oldPrice: 159.99, image: "/images/women12.jpeg", badge: "Sale", category: "women", stock: 12, status: "active" }
    ],
    men: [
      { id: 13, name: "Men's Slim Fit Shirt", price: 39.99, oldPrice: 49.99, image: "/images/men2.jpeg", badge: "New", category: "men", stock: 45, status: "active" },
      { id: 14, name: "Men's Cargo Pants", price: 49.99, oldPrice: 59.99, image: "/images/men3.jpeg", category: "men", stock: 35, status: "active" },
      { id: 15, name: "Men's Leather Jacket", price: 89.99, oldPrice: 109.99, image: "/images/men4.jpeg", badge: "Sale", category: "men", stock: 10, status: "active" },
      { id: 16, name: "Men's Casual Polo", price: 34.99, oldPrice: 44.99, image: "/images/men5.jpeg", category: "men", stock: 50, status: "active" },
      { id: 17, name: "Men's Wool Coat", price: 99.99, oldPrice: 129.99, image: "/images/men6.jpeg", badge: "New", category: "men", stock: 8, status: "active" },
      { id: 18, name: "Men's Chino Shorts", price: 29.99, oldPrice: 39.99, image: "/images/men7.jpeg", category: "men", stock: 40, status: "active" },
      { id: 19, name: "Men's Denim Shirt", price: 44.99, oldPrice: 54.99, image: "/images/men8.jpeg", badge: "Sale", category: "men", stock: 28, status: "active" },
      { id: 20, name: "Men's Track Jacket", price: 59.99, oldPrice: 69.99, image: "/images/men9.jpeg", category: "men", stock: 32, status: "active" },
      { id: 21, name: "Men's Flannel Shirt", price: 39.99, oldPrice: 49.99, image: "/images/men10.jpeg", badge: "New", category: "men", stock: 38, status: "active" },
      { id: 22, name: "Men's Winter Parka", price: 119.99, oldPrice: 149.99, image: "/images/men11.jpeg", category: "men", stock: 6, status: "active" }
    ],
    kids: [
      { id: 23, name: "Kids Graphic Tee", price: 19.99, oldPrice: 24.99, image: "/images/kids1.jpeg", badge: "New", category: "kids", stock: 55, status: "active" },
      { id: 24, name: "Kids Denim Overalls", price: 24.99, oldPrice: 29.99, image: "/images/kids2.jpeg", category: "kids", stock: 30, status: "active" },
      { id: 25, name: "Kids Hooded Jacket", price: 29.99, oldPrice: 34.99, image: "/images/kids3.jpeg", badge: "Sale", category: "kids", stock: 25, status: "active" },
      { id: 26, name: "Kids Jogger Pants", price: 19.99, oldPrice: 24.99, image: "/images/kids4.jpeg", category: "kids", stock: 45, status: "active" },
      { id: 27, name: "Kids Sweater", price: 22.99, oldPrice: 27.99, image: "/images/kids5.jpeg", badge: "New", category: "kids", stock: 35, status: "active" },
      { id: 28, name: "Kids Rain Boots", price: 18.99, oldPrice: 22.99, image: "/images/kids6.jpeg", category: "kids", stock: 40, status: "active" },
      { id: 29, name: "Kids Backpack", price: 15.99, oldPrice: 19.99, image: "/images/kids7.jpeg", badge: "Sale", category: "kids", stock: 60, status: "active" },
      { id: 30, name: "Kids Swim Shorts", price: 14.99, oldPrice: 18.99, image: "/images/kids8.jpeg", category: "kids", stock: 50, status: "active" },
      { id: 31, name: "Kids Pajama Set", price: 17.99, oldPrice: 21.99, image: "/images/kids9.jpeg", badge: "New", category: "kids", stock: 38, status: "active" },
      { id: 32, name: "Kids Baseball Cap", price: 12.99, oldPrice: 16.99, image: "/images/kids10.jpeg", category: "kids", stock: 65, status: "active" }
    ],
    baby: [
      { id: 33, name: "Baby Bodysuit Set", price: 19.99, oldPrice: 24.99, image: "/images/baby1.jpeg", badge: "New", category: "baby", stock: 70, status: "active" },
      { id: 34, name: "Baby Romper", price: 24.99, oldPrice: 29.99, image: "/images/baby2.jpeg", category: "baby", stock: 45, status: "active" },
      { id: 35, name: "Baby Hooded Towel", price: 29.99, oldPrice: 34.99, image: "/images/baby3.jpeg", badge: "Sale", category: "baby", stock: 30, status: "active" },
      { id: 36, name: "Baby Sleepsack", price: 19.99, oldPrice: 24.99, image: "/images/baby4.jpeg", category: "baby", stock: 55, status: "active" },
      { id: 37, name: "Baby Knit Cardigan", price: 22.99, oldPrice: 27.99, image: "/images/baby5.jpeg", badge: "New", category: "baby", stock: 40, status: "active" },
      { id: 38, name: "Baby Booties", price: 18.99, oldPrice: 22.99, image: "/images/baby6.jpeg", category: "baby", stock: 60, status: "active" },
      { id: 39, name: "Baby Bib Set", price: 15.99, oldPrice: 19.99, image: "/images/baby7.jpeg", badge: "Sale", category: "baby", stock: 75, status: "active" },
      { id: 40, name: "Baby Sun Hat", price: 14.99, oldPrice: 18.99, image: "/images/baby8.jpeg", category: "baby", stock: 50, status: "active" },
      { id: 41, name: "Baby Footed Pajamas", price: 17.99, oldPrice: 21.99, image: "/images/baby9.jpeg", badge: "New", category: "baby", stock: 42, status: "active" },
      { id: 42, name: "Baby Mittens", price: 12.99, oldPrice: 16.99, image: "/images/baby10.jpeg", category: "baby", stock: 80, status: "active" }
    ]
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Combine all products from all categories
      const allProducts = Object.values(productsData).flat();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== productId));
      // In a real app, you'd call an API to delete the product
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData } : p
      ));
    } else {
      // Add new product
      const newProduct = {
        ...productData,
        id: Math.max(...products.map(p => p.id)) + 1,
        stock: productData.stock || 0,
        status: productData.status || 'active'
      };
      setProducts([...products, newProduct]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#4caf50' : '#f44336';
  };

  const getStockColor = (stock) => {
    if (stock === 0) return '#f44336';
    if (stock < 10) return '#ff9800';
    return '#4caf50';
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'women', label: 'Women' },
    { value: 'men', label: 'Men' },
    { value: 'kids', label: 'Kids' },
    { value: 'baby', label: 'Baby' }
  ];

  if (loading) {
    return (
      <div className="admin-products">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="products-header">
        <div className="header-content">
          <h1>Product Management</h1>
          <p>Manage your product inventory and listings</p>
        </div>
        <button className="btn-primary" onClick={handleAddProduct}>
          <i className="fas fa-plus"></i>
          Add New Product
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="products-stats">
          <span>Total Products: {filteredProducts.length}</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <i className="fas fa-tshirt"></i>
            <h3>No products found</h3>
            <p>Try adjusting your search criteria or add a new product.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.image} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x400/cccccc/ffffff?text=Image+Not+Found';
                  }}
                />
                {product.badge && <span className="product-badge">{product.badge}</span>}
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-category">
                  <span className="category-tag">{product.category}</span>
                </div>
                <div className="product-price">
                  <span className="current-price">{formatPrice(product.price)}</span>
                  {product.oldPrice && (
                    <span className="old-price">{formatPrice(product.oldPrice)}</span>
                  )}
                </div>
                
                <div className="product-meta">
                  <div className="stock-info">
                    <span 
                      className="stock-badge"
                      style={{ backgroundColor: getStockColor(product.stock) }}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="status-info">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(product.status) }}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEditProduct(product)}
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

// Product Form Component
const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    oldPrice: product?.oldPrice || '',
    category: product?.category || 'women',
    stock: product?.stock || 0,
    status: product?.status || 'active',
    badge: product?.badge || '',
    image: product?.image || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Old Price ($)</label>
              <input
                type="number"
                name="oldPrice"
                value={formData.oldPrice}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="kids">Kids</option>
                <option value="baby">Baby</option>
              </select>
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label>Badge</label>
              <select
                name="badge"
                value={formData.badge}
                onChange={handleChange}
              >
                <option value="">No Badge</option>
                <option value="New">New</option>
                <option value="Sale">Sale</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProducts;