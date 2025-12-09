// Products functionality
const API_BASE = '/api';

// Get all products
async function getProducts(category = null, search = null) {
  try {
    let url = `${API_BASE}/products`;
    const params = [];
    
    if (category) {
      params.push(`category=${category}`);
    }
    
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const response = await fetch(url);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Get product by ID
async function getProductById(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch product');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get featured products
async function getFeaturedProducts() {
  try {
    const response = await fetch(`${API_BASE}/products/featured`);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch featured products');
    }
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Add product to cart
async function addToCart(productId, quantity = 1) {
  try {
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        productId,
        quantity
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// Add product to wishlist
async function addToWishlist(productId) {
  try {
    const response = await fetch(`${API_BASE}/wishlist/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ productId })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to add to wishlist');
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return null;
  }
}