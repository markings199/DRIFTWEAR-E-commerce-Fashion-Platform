// services/cart.service.js

class CartService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
  }

  async getCart() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Fallback to localStorage for offline/demo mode
      return this.getCartFromLocalStorage();
    }
  }

  async updateCartItem(productId, quantity, size = 'M', color = 'Blue') {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity,
          size,
          color
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating cart item:', error);
      // Fallback to localStorage for offline/demo mode
      this.updateCartItemInLocalStorage(productId, quantity, size, color);
      return { success: true };
    }
  }

  async removeFromCart(productId, size = 'M', color = 'Blue') {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/cart/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ size, color })
      });

      if (!response.ok) {
        throw new Error('Failed to remove cart item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing cart item:', error);
      // Fallback to localStorage for offline/demo mode
      this.removeFromCartInLocalStorage(productId, size, color);
      return { success: true };
    }
  }

  // Local storage fallback methods
  getCartFromLocalStorage() {
    const userData = localStorage.getItem('driftwear_user');
    if (userData) {
      const user = JSON.parse(userData);
      const userCart = localStorage.getItem(`driftwear_cart_${user.id}`);
      return { items: userCart ? JSON.parse(userCart) : [] };
    } else {
      const cart = localStorage.getItem('cart');
      return { items: cart ? JSON.parse(cart) : [] };
    }
  }

  updateCartItemInLocalStorage(productId, quantity, size, color) {
    let cart = this.getCartFromLocalStorage().items;
    
    const existingItem = cart.find(item => 
      (item.productId?._id === productId || item.id === productId) && 
      (item.size === size) && 
      (item.color === color)
    );
    
    if (existingItem) {
      existingItem.quantity = quantity;
    } else {
      cart.push({
        id: productId,
        productId: { _id: productId },
        quantity,
        size,
        color,
        price: 0, // This would need to be populated from product data
        name: 'Product',
        image: 'https://via.placeholder.com/300'
      });
    }
    
    this.saveCartToLocalStorage(cart);
  }

  removeFromCartInLocalStorage(productId, size, color) {
    let cart = this.getCartFromLocalStorage().items;
    cart = cart.filter(item => 
      !((item.productId?._id === productId || item.id === productId) && 
        item.size === size && 
        item.color === color)
    );
    
    this.saveCartToLocalStorage(cart);
  }

  saveCartToLocalStorage(cart) {
    const userData = localStorage.getItem('driftwear_user');
    if (userData) {
      const user = JSON.parse(userData);
      localStorage.setItem(`driftwear_cart_${user.id}`, JSON.stringify(cart));
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }
}

export const cartService = new CartService();