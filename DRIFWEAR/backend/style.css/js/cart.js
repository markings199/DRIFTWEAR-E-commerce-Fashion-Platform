class CartManager {
  constructor() {
    this.cart = null;
    this.init();
  }

  async init() {
    await this.loadCart();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.handleCheckout());
    }

    // Clear cart button
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => this.clearCart());
    }
  }

  async loadCart() {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        this.cart = await response.json();
        this.renderCart();
      } else if (response.status === 401) {
        // User not authenticated
        this.showAuthRequired();
      } else {
        throw new Error('Failed to load cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      this.showError();
    }
  }

  renderCart() {
    const cartContainer = document.getElementById('cart-container');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartContainer || !cartSummary) return;

    if (!this.cart || this.cart.items.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
          <a href="/products.html" class="btn">Continue Shopping</a>
        </div>
      `;
      cartSummary.innerHTML = '';
      return;
    }

    let cartHTML = '';
    this.cart.items.forEach(item => {
      cartHTML += `
        <div class="cart-item" data-id="${item._id}">
          <div class="cart-item-image">
            <img src="${item.product.images && item.product.images[0] ? item.product.images[0] : 'https://via.placeholder.com/150'}" alt="${item.product.name}">
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${item.product.name}</h3>
            <div class="cart-item-price">${formatPrice(item.product.price)}</div>
            ${item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : ''}
            ${item.color ? `<div class="cart-item-color">Color: ${item.color}</div>` : ''}
            <div class="cart-item-actions">
              <div class="quantity-control">
                <button class="quantity-btn" onclick="cartManager.updateQuantity('${item._id}', ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="cartManager.updateQuantityInput('${item._id}', this.value)">
                <button class="quantity-btn" onclick="cartManager.updateQuantity('${item._id}', ${item.quantity + 1})">+</button>
              </div>
              <button class="remove-btn" onclick="cartManager.removeItem('${item._id}')">
                <i class="fas fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });

    cartContainer.innerHTML = cartHTML;

    // Update summary
    const subtotal = this.cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 10 : 0; // $10 shipping
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    cartSummary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>${formatPrice(shipping)}</span>
      </div>
      <div class="summary-row">
        <span>Tax:</span>
        <span>${formatPrice(tax)}</span>
      </div>
      <div class="summary-row summary-total">
        <span>Total:</span>
        <span>${formatPrice(total)}</span>
      </div>
      <button id="checkout-btn" class="btn" style="width: 100%; margin-top: 20px;">
        Proceed to Checkout
      </button>
    `;

    // Reattach event listener to checkout button
    document.getElementById('checkout-btn').addEventListener('click', () => this.handleCheckout());
  }

  async addToCart(productId, quantity = 1, size = '', color = '') {
    try {
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity,
          size,
          color
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        this.cart = result.cart;
        this.renderCart();
        
        // Update cart count in main app
        if (window.driftwearApp) {
          window.driftwearApp.updateCartCount();
        }
        
        window.driftwearApp.showNotification('Product added to cart!');
        return true;
      } else if (response.status === 401) {
        window.driftwearApp.showNotification('Please login to add items to cart', 'error');
        return false;
      } else {
        const error = await response.json();
        window.driftwearApp.showNotification(error.error || 'Failed to add to cart', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      window.driftwearApp.showNotification('An error occurred', 'error');
      return false;
    }
  }

  async updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;
    
    try {
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        this.cart = result.cart;
        this.renderCart();
        
        // Update cart count in main app
        if (window.driftwearApp) {
          window.driftwearApp.updateCartCount();
        }
      } else {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      window.driftwearApp.showNotification('Failed to update quantity', 'error');
    }
  }

  updateQuantityInput(itemId, value) {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      this.updateQuantity(itemId, quantity);
    }
  }

  async removeItem(itemId) {
    try {
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        this.cart = result.cart;
        this.renderCart();
        
        // Update cart count in main app
        if (window.driftwearApp) {
          window.driftwearApp.updateCartCount();
        }
        
        window.driftwearApp.showNotification('Item removed from cart');
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      window.driftwearApp.showNotification('Failed to remove item', 'error');
    }
  }

  async clearCart() {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        this.cart = result.cart;
        this.renderCart();
        
        // Update cart count in main app
        if (window.driftwearApp) {
          window.driftwearApp.updateCartCount();
        }
        
        window.driftwearApp.showNotification('Cart cleared');
      } else {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      window.driftwearApp.showNotification('Failed to clear cart', 'error');
    }
  }

  async handleCheckout() {
    if (!this.cart || this.cart.items.length === 0) {
      window.driftwearApp.showNotification('Your cart is empty', 'error');
      return;
    }

    window.location.href = '/checkout.html';
  }

  showAuthRequired() {
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-lock"></i>
          <p>Please login to view your cart</p>
          <a href="/signup.html" class="btn">Login or Sign Up</a>
        </div>
      `;
    }
  }

  showError() {
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load cart. Please try again.</p>
        </div>
      `;
    }
  }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-container')) {
    window.cartManager = new CartManager();
  }
});