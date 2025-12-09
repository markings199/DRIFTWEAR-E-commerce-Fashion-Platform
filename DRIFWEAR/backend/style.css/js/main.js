// API base URL
const API_BASE = '/api';

// Common functions used across the site
class DriftwearApp {
  constructor() {
    this.currentUser = null;
    this.cartCount = 0;
    this.init();
  }

  async init() {
    await this.checkAuth();
    await this.updateCartCount();
    this.setupEventListeners();
  }

  async checkAuth() {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        this.updateUIForAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  updateUIForAuth() {
    const authElements = document.querySelectorAll('.auth-only');
    const nonAuthElements = document.querySelectorAll('.non-auth-only');
    
    if (this.currentUser) {
      authElements.forEach(el => el.style.display = 'block');
      nonAuthElements.forEach(el => el.style.display = 'none');
      
      // Update user name if element exists
      const userNameEl = document.getElementById('user-name');
      if (userNameEl) {
        userNameEl.textContent = this.currentUser.name;
      }
    } else {
      authElements.forEach(el => el.style.display = 'none');
      nonAuthElements.forEach(el => el.style.display = 'block');
    }
  }

  async updateCartCount() {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const cart = await response.json();
        this.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        this.updateCartUI();
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }

  updateCartUI() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
      el.textContent = this.cartCount;
      el.style.display = this.cartCount > 0 ? 'flex' : 'none';
    });
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => this.handleSearch(e));
    }
  }

  async logout() {
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        this.currentUser = null;
        this.updateUIForAuth();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  handleSearch(e) {
    e.preventDefault();
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (query) {
      window.location.href = `/products.html?search=${encodeURIComponent(query)}`;
    }
  }

  // Show notification
  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 5px;
          color: white;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .notification-success { background: #27ae60; }
        .notification-error { background: #e74c3c; }
        .notification-info { background: #3498db; }
        .notification.show { transform: translateX(0); }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          margin-left: 15px;
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Add to page and animate in
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.driftwearApp = new DriftwearApp();
});

// Utility function to format price
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Utility function to handle API errors
function handleApiError(error) {
  console.error('API Error:', error);
  if (window.driftwearApp) {
    window.driftwearApp.showNotification('An error occurred. Please try again.', 'error');
  }
  return null;
}