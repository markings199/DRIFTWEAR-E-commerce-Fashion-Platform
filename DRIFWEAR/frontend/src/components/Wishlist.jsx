import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Wishlist.css';

const Wishlist = ({ openAuthModal, currentUser }) => {
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const profileBtnRef = useRef(null);
  const wishlistItemsRef = useRef([]);
  const observerRef = useRef(null);

  // Initialize Intersection Observer
  const initIntersectionObserver = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observerRef.current.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all wishlist items
    wishlistItemsRef.current.forEach(item => {
      if (item) {
        observerRef.current.observe(item);
      }
    });
  };

  // Reset animations when wishlist changes
  const resetWishlistAnimations = () => {
    wishlistItemsRef.current.forEach(item => {
      if (item) {
        item.classList.remove('animate-in');
      }
    });
    
    // Re-initialize observer after a small delay to ensure DOM is updated
    setTimeout(() => {
      initIntersectionObserver();
    }, 100);
  };

  // Wishlist Manager - UPDATED to ensure category data is preserved
  const loadUserWishlist = () => {
    const userData = localStorage.getItem('driftwear_user');
    let wishlistData = [];
    
    if (userData) {
      const user = JSON.parse(userData);
      const userWishlist = localStorage.getItem(`driftwear_wishlist_${user.id}`);
      wishlistData = userWishlist ? JSON.parse(userWishlist) : [];
    } else {
      wishlistData = JSON.parse(localStorage.getItem('wishlist')) || [];
    }

    // DEBUG: Log the loaded wishlist data
    console.log('Loaded wishlist data:', wishlistData);
    
    return wishlistData;
  };

  const saveUserWishlist = (wishlistData) => {
    const userData = localStorage.getItem('driftwear_user');
    if (userData) {
      const user = JSON.parse(userData);
      localStorage.setItem(`driftwear_wishlist_${user.id}`, JSON.stringify(wishlistData));
    } else {
      localStorage.setItem('wishlist', JSON.stringify(wishlistData));
    }
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(newWishlist);
    saveUserWishlist(newWishlist);
    updateWishlistCount(newWishlist);
    filterWishlistByCategory(activeCategory, newWishlist);
  };

  const updateWishlistCount = (wishlistData) => {
    const count = wishlistData.length;
    // You can update a global state or context here if needed
  };

  // Cart Manager
  const loadUserCart = () => {
    const userData = localStorage.getItem('driftwear_user');
    if (userData) {
      const user = JSON.parse(userData);
      const userCart = localStorage.getItem(`driftwear_cart_${user.id}`);
      return userCart ? JSON.parse(userCart) : [];
    } else {
      return JSON.parse(localStorage.getItem('cart')) || [];
    }
  };

  const saveUserCart = (cartData) => {
    const userData = localStorage.getItem('driftwear_user');
    if (userData) {
      const user = JSON.parse(userData);
      localStorage.setItem(`driftwear_cart_${user.id}`, JSON.stringify(cartData));
    } else {
      localStorage.setItem('cart', JSON.stringify(cartData));
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        category: product.category // Preserve category
      }];
    }
    
    setCart(newCart);
    saveUserCart(newCart);
    updateCartCount(newCart);
  };

  const updateCartCount = (cartData) => {
    const count = cartData.reduce((total, item) => total + item.quantity, 0);
    // You can update a global state or context here if needed
  };

  // SIMPLIFIED AND IMPROVED: Better category filtering logic
  const filterWishlistByCategory = (category, wishlistData = wishlist) => {
    console.log('Filtering by category:', category, 'Wishlist data:', wishlistData);
    
    if (category === 'all') {
      setFilteredWishlist(wishlistData);
    } else {
      const filtered = wishlistData.filter(item => {
        // Check if item has a category property
        const itemCategory = (item.category || '').toLowerCase();
        console.log(`Checking item: ${item.name}, Category: ${itemCategory}`);
        
        // Direct category match
        if (itemCategory === category.toLowerCase()) {
          return true;
        }
        
        // For backward compatibility - check product ID ranges
        // Women: IDs 1-12, Men: IDs 13-22, Kids: IDs 23-32, Baby: IDs 33-42
        if (item.id >= 1 && item.id <= 12 && category === 'women') return true;
        if (item.id >= 13 && item.id <= 22 && category === 'men') return true;
        if (item.id >= 23 && item.id <= 32 && category === 'kids') return true;
        if (item.id >= 33 && item.id <= 42 && category === 'baby') return true;
        
        return false;
      });
      console.log('Filtered results:', filtered);
      setFilteredWishlist(filtered);
    }
    setActiveCategory(category);
  };

  // SIMPLIFIED: Better category counting
  const getCategoryCount = (category) => {
    if (category === 'all') return wishlist.length;
    
    return wishlist.filter(item => {
      const itemCategory = (item.category || '').toLowerCase();
      
      // Direct category match
      if (itemCategory === category.toLowerCase()) {
        return true;
      }
      
      // For backward compatibility - check product ID ranges
      if (item.id >= 1 && item.id <= 12 && category === 'women') return true;
      if (item.id >= 13 && item.id <= 22 && category === 'men') return true;
      if (item.id >= 23 && item.id <= 32 && category === 'kids') return true;
      if (item.id >= 33 && item.id <= 42 && category === 'baby') return true;
      
      return false;
    }).length;
  };

  // Initialize data - UPDATED to fix category detection
  useEffect(() => {
    const wishlistData = loadUserWishlist();
    const cartData = loadUserCart();
    
    // Ensure all wishlist items have proper category data
    const enhancedWishlist = wishlistData.map(item => {
      // If category is missing, determine it from product ID
      if (!item.category) {
        if (item.id >= 1 && item.id <= 12) item.category = 'women';
        else if (item.id >= 13 && item.id <= 22) item.category = 'men';
        else if (item.id >= 23 && item.id <= 32) item.category = 'kids';
        else if (item.id >= 33 && item.id <= 42) item.category = 'baby';
        else item.category = 'unknown';
      }
      return item;
    });
    
    setWishlist(enhancedWishlist);
    setFilteredWishlist(enhancedWishlist);
    setCart(cartData);
    updateWishlistCount(enhancedWishlist);
    updateCartCount(cartData);

    // Add scroll event listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize animations when wishlist is loaded or changed
  useEffect(() => {
    if (wishlist.length > 0) {
      resetWishlistAnimations();
    }
  }, [wishlist, filteredWishlist, activeCategory]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && profileBtnRef.current &&
          !profileMenuRef.current.contains(event.target) && 
          !profileBtnRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const redirectToAssistance = () => {
    navigate('/messages');
  };

  const logout = () => {
    localStorage.removeItem('driftwear_user');
    navigate('/');
  };

  const redirectToProductDetail = (product) => {
    localStorage.setItem('currentProduct', JSON.stringify(product));
    navigate(`/product/${product.id}`, { 
      state: { product } 
    });
  };

  const handleAddToCart = (productId, e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const userData = localStorage.getItem('driftwear_user');
    if (!userData) {
      if (openAuthModal) {
        openAuthModal('login');
      }
      displayToast('Please log in to add items to cart');
      return;
    }

    const product = wishlist.find(p => p.id === productId);
    if (product) {
      addToCart(product);
      displayToast('Product added to cart!');
    }
  };

  const handleRemoveFromWishlist = (productId, e) => {
    e.stopPropagation();
    removeFromWishlist(productId);
    displayToast('Product removed from wishlist!');
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  // Navigation functions
  const redirectToHome = () => {
    navigate('/');
  };

  const redirectToProducts = () => {
    navigate('/products');
  };

  const redirectToCart = () => {
    navigate('/cart');
  };

  const redirectToOrders = () => {
    navigate('/orders');
  };

  // Category filter functions
  const filterByWomen = () => {
    filterWishlistByCategory('women');
  };

  const filterByMen = () => {
    filterWishlistByCategory('men');
  };

  const filterByKids = () => {
    filterWishlistByCategory('kids');
  };

  const filterByBaby = () => {
    filterWishlistByCategory('baby');
  };

  const showAllWishlist = () => {
    filterWishlistByCategory('all');
  };

  const getDisplayWishlist = () => {
    return activeCategory === 'all' ? wishlist : filteredWishlist;
  };

  // Function to set wishlist item ref
  const setWishlistItemRef = (el, index) => {
    wishlistItemsRef.current[index] = el;
  };

  // Debug function to check product categories
  const debugProductCategories = () => {
    console.log('=== WISHLIST DEBUG INFO ===');
    console.log('Total items:', wishlist.length);
    wishlist.forEach(item => {
      console.log(`Product: ${item.name}, ID: ${item.id}, Category: ${item.category}`);
    });
    console.log('Women count:', getCategoryCount('women'));
    console.log('Men count:', getCategoryCount('men'));
    console.log('Kids count:', getCategoryCount('kids'));
    console.log('Baby count:', getCategoryCount('baby'));
    console.log('==========================');
  };

  // Call debug on component mount to check categories
  useEffect(() => {
    if (wishlist.length > 0) {
      debugProductCategories();
    }
  }, [wishlist]);

  return (
    <div className="wishlist-page">
      {/* Top Bar */}
      <div className="top-bar">
        FREE SHIPPING ON ALL ORDERS OVER $50
      </div>
      
      {/* Header */}
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-main">
            <div className="logo" onClick={redirectToHome} style={{cursor: 'pointer'}}>
              DRIFTWEAR
            </div>
            
            <div className="header-center">
              <div className="search-bar">
                <i className="fas fa-search" onClick={handleSearch} style={{cursor: 'pointer'}}></i>
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            
            <div className="header-actions">
              {/* Products Button - More prominent design */}
              <button className="products-btn" onClick={redirectToProducts}>
                <i className="fas fa-store"></i>
                <span>Products</span>
              </button>
              
              <button className="icon-btn">
                <i className="fas fa-heart"></i>
                <span className="wishlist-count">{getWishlistCount()}</span>
              </button>
              <button className="icon-btn" onClick={redirectToCart}>
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-count">{getCartCount()}</span>
              </button>
              <div className="profile-dropdown">
                <button className="icon-btn" onClick={toggleProfileMenu} ref={profileBtnRef}>
                  <i className="fas fa-user"></i>
                </button>
                <div className={`profile-menu ${showProfileMenu ? 'show' : ''}`} ref={profileMenuRef}>
                  <div className="profile-menu-item" onClick={redirectToAssistance}>
                    <i className="fas fa-headset"></i>
                    <span>Assistance</span>
                  </div>
                  <div className="profile-menu-item" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="container">
        <div className="category-tabs">
          <button 
            className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`} 
            onClick={showAllWishlist}
          >
            All ({wishlist.length})
          </button>
          <button 
            className={`category-tab ${activeCategory === 'women' ? 'active' : ''}`} 
            onClick={filterByWomen}
          >
            Women ({getCategoryCount('women')})
          </button>
          <button 
            className={`category-tab ${activeCategory === 'men' ? 'active' : ''}`} 
            onClick={filterByMen}
          >
            Men ({getCategoryCount('men')})
          </button>
          <button 
            className={`category-tab ${activeCategory === 'kids' ? 'active' : ''}`} 
            onClick={filterByKids}
          >
            Kids ({getCategoryCount('kids')})
          </button>
          <button 
            className={`category-tab ${activeCategory === 'baby' ? 'active' : ''}`} 
            onClick={filterByBaby}
          >
            Baby ({getCategoryCount('baby')})
          </button>
        </div>
      </div>
      
      {/* Wishlist Section */}
      <section className="section">
        <div className="container">
          <div className="wishlist-header">
            <h2 className="section-title">Your Wishlist</h2>
            {activeCategory !== 'all' && (
              <p className="category-filter-info">
                Showing {filteredWishlist.length} {activeCategory} item{filteredWishlist.length !== 1 ? 's' : ''} in your wishlist
              </p>
            )}
          </div>
          <div className="wishlist" id="wishlist-container">
            {getDisplayWishlist().map((item, index) => (
              <div 
                key={item.id} 
                className="wishlist-item" 
                onClick={() => redirectToProductDetail(item)}
                ref={(el) => setWishlistItemRef(el, index)}
              >
                <div className="wishlist-image">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x400/cccccc/ffffff?text=Image+Not+Found';
                    }}
                  />
                </div>
                <div className="wishlist-info">
                  <h3 className="wishlist-name">{item.name}</h3>
                  <div className="wishlist-meta">
                    {item.category && (
                      <span className="wishlist-category">{item.category.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="wishlist-price">
                    <span className="current-price">${item.price?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="wishlist-actions">
                    <button 
                      className="btn-cart" 
                      onClick={(e) => handleAddToCart(item.id, e)}
                    >
                      Add to Cart
                    </button>
                    <button 
                      className="btn-remove" 
                      onClick={(e) => handleRemoveFromWishlist(item.id, e)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {getDisplayWishlist().length === 0 && (
            <div className="empty-wishlist" id="empty-wishlist">
              {activeCategory === 'all' ? (
                <>
                  Your wishlist is empty. <button 
                    onClick={redirectToProducts}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand)',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Browse products
                  </button> to add items!
                </>
              ) : (
                <>
                  No {activeCategory} items in your wishlist. <button 
                    onClick={showAllWishlist}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand)',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    View all wishlist items
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${showToast ? 'show' : ''}`}>
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>DRIFTWEAR</h3>
              <p className="footer-description">
                Premium clothing for everyone.<br />
                Quality, style, and comfort in one place.
              </p>
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
                <li><button onClick={filterByWomen}>Women's Clothing</button></li>
                <li><button onClick={filterByMen}>Men's Clothing</button></li>
                <li><button onClick={filterByKids}>Kids' Clothing</button></li>
                <li><button onClick={filterByBaby}>Baby Clothing</button></li>
                <li><button onClick={redirectToProducts}>New Arrivals</button></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Company</h3>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Sitemap</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Customer Service</h3>
              <ul className="footer-links">
                <li><button onClick={redirectToAssistance}>Contact Us</button></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Shipping & Returns</a></li>
                <li><a href="#">Size Guide</a></li>
                <li><button onClick={redirectToOrders}>Track Order</button></li>
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
};

export default Wishlist;