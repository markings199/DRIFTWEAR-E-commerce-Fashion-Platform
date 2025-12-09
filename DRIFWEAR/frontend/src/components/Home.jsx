import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../css/style.css";

function Home({ openAuthModal, currentUser, onLogout }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedProducts();
    loadCart();
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    
    // Check URL parameters to see if we should show auth modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'show') {
      if (openAuthModal) {
        openAuthModal('login');
      }
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [openAuthModal]);

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const loadFeaturedProducts = async () => {
    try {
      const mockProducts = [
        {
          _id: '1',
          name: 'Premium T-Shirt',
          price: 29.99,
          onSale: true,
          discountPercentage: 20,
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
        },
        {
          _id: '2',
          name: 'Classic Jeans',
          price: 59.99,
          onSale: false,
          images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
        },
        {
          _id: '3',
          name: 'Winter Jacket',
          price: 129.99,
          onSale: true,
          discountPercentage: 15,
          images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
        },
        {
          _id: '4',
          name: 'Sports Shoes',
          price: 89.99,
          onSale: false,
          images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
        }
      ];
      setFeaturedProducts(mockProducts);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    try {
      if (currentUser) {
        const cartData = localStorage.getItem(`driftwear_cart_${currentUser.id}`);
        if (cartData) {
          setCart(JSON.parse(cartData));
        }
      } else {
        const cartData = localStorage.getItem('driftwear_cart');
        if (cartData) {
          setCart(JSON.parse(cartData));
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
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
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    showNotification('Thank you for subscribing to our newsletter!');
    e.target.reset();
  };

  const handleShopNow = () => {
    navigate('/products');
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // FIXED PROFILE NAVIGATION
  const handleProfileNavigation = () => {
    if (currentUser && currentUser.id) {
      navigate('/profile');
    } else {
      // If no user is logged in, open auth modal
      if (openAuthModal) {
        openAuthModal('login');
      } else {
        // Fallback to products page if auth modal isn't available
        navigate('/products');
      }
    }
  };

  return (
    <div className="home-page">
      {/* Top Bar */}
      <div className="top-bar">
        FREE SHIPPING ON ALL ORDERS OVER $50
      </div>

      {/* Header - Fixed alignment */}
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-main">
            {/* Left section - Navigation */}
            <div className="header-left">
              <nav>
                <ul className="nav-menu">
                  <li><Link to="/products">Men</Link></li>
                  <li><Link to="/products">Women</Link></li>
                  <li><Link to="/products">Accessories</Link></li>
                  <li><Link to="/products">New Arrivals</Link></li>
                </ul>
              </nav>
            </div>
            
            {/* Center section - Logo */}
            <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
              DRIFTWEAR
            </div>
            
            {/* Right section - User actions */}
            <div className="header-actions">
              {/* User Profile Section */}
              {currentUser ? (
                <div className="user-profile">
                  <div className="user-greeting">Hello, {currentUser.name || currentUser.username || 'User'}</div>
                  <div className="user-menu">
                    <button 
                      className="profile-btn" 
                      onClick={handleProfileNavigation}
                      title="View Profile"
                    >
                      <i className="fas fa-user"></i>
                    </button>
                    <button 
                      className="btn-logout" 
                      onClick={onLogout}
                      style={{marginLeft: '10px'}}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={() => openAuthModal ? openAuthModal('login') : navigate('/products')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-video" id="hero-video-container">
          <video 
            id="hero-video"
            autoPlay 
            muted 
            loop 
            playsInline 
            preload="metadata"
            poster="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
          >
            <source src="/images/0930(1).mp4" type="video/mp4" />
            <source src="/0930(1).mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="hero-overlay"></div>
        
        <div className="container">
          <div className="hero-content">
            <h1>ELEVATE YOUR STYLE WITH DRIFTWEAR</h1>
            <p>Discover the latest trends in fashion and express your unique style with our premium collection</p>
            <div className="hero-actions">
              <button className="btn" onClick={handleShopNow}>Shop Now</button>
              <button className="btn btn-outline" onClick={() => navigate('/products?new=true')}>
                New Arrivals
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          
          <div className="categories">
            <div className="category-card" onClick={() => navigate('/products?category=men')}>
              <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Men's Collection" />
              <div className="category-name">Men's Collection</div>
            </div>
            
            <div className="category-card" onClick={() => navigate('/products?category=women')}>
              <img src="https://images.unsplash.com/photo-1529903384028-929ae5dccdf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Women's Collection" />
              <div className="category-name">Women's Collection</div>
            </div>
            
            <div className="category-card" onClick={() => navigate('/products?category=accessories')}>
              <img src="https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Accessories" />
              <div className="category-name">Accessories</div>
            </div>
            
            <div className="category-card" onClick={() => navigate('/products?new=true')}>
              <img src="https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="New Arrivals" />
              <div className="category-name">New Arrivals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          
          {loading ? (
            <div className="products-loading">Loading products...</div>
          ) : (
            <div className="products" id="featured-products">
              {featuredProducts.map(product => {
                const salePrice = product.onSale 
                  ? product.price * (1 - product.discountPercentage / 100) 
                  : product.price;

                return (
                  <div 
                    key={product._id} 
                    className="product-card"
                    onClick={() => handleProductClick(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image">
                      {product.onSale && <span className="product-badge">SALE</span>}
                      <img 
                        src={product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300'} 
                        alt={product.name}
                      />
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-price">
                        <span className="current-price">{formatPrice(salePrice)}</span>
                        {product.onSale && (
                          <>
                            <span className="old-price">{formatPrice(product.price)}</span>
                            <span className="discount">{product.discountPercentage}% OFF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2 className="section-title">Join Our Newsletter</h2>
            <p>Subscribe to our newsletter and get 10% off your first purchase</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Your email address" 
                required
              />
              <button type="submit" className="btn">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>DRIFTWEAR</h3>
              <p>Premium clothing for everyone. Quality, style, and comfort in one place.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-pinterest"></i></a>
              </div>
            </div>
            
            <div className="footer-column">
              <h3>Shop</h3>
              <ul className="footer-links">
                <li><Link to="/products?category=men">Men's Clothing</Link></li>
                <li><Link to="/products?category=women">Women's Clothing</Link></li>
                <li><Link to="/products?category=kids">Kids' Clothing</Link></li>
                <li><Link to="/products?category=accessories">Accessories</Link></li>
                <li><Link to="/products?new=true">New Arrivals</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Company</h3>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/sitemap">Sitemap</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Customer Service</h3>
              <ul className="footer-links">
                <li><Link to="/messages">Contact Us</Link></li>
                <li><Link to="/faq">FAQs</Link></li>
                <li><Link to="/shipping">Shipping & Returns</Link></li>
                <li><Link to="/size-guide">Size Guide</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 DRIFTWEAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;