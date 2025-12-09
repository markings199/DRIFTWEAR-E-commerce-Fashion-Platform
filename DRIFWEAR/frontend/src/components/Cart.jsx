import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Cart.css';

function Cart({ openAuthModal, currentUser }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const cartItemsRef = useRef([]);
  const observerRef = useRef(null);

  const navigate = useNavigate();

  // Initialize Intersection Observer for animations
  useEffect(() => {
    const initializeObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
              observerRef.current.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      // Observe all cart items
      cartItemsRef.current.forEach((item) => {
        if (item) {
          observerRef.current.observe(item);
        }
      });
    };

    // Initialize observer when cart items change
    if (cartItems.length > 0) {
      setTimeout(initializeObserver, 100);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cartItems]);

  // Function to restore cart if needed
  const restoreOriginalCartIfNeeded = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      // Check if we have a checkout_temp that wasn't completed
      const checkoutTempKey = userData.id 
        ? `driftwear_checkout_temp_${userData.id}`
        : `driftwear_checkout_temp_guest`;
      
      const originalCartKey = userData.id 
        ? `driftwear_original_cart_${userData.id}`
        : `driftwear_original_cart_guest`;
      
      const hasTempCheckout = localStorage.getItem(checkoutTempKey);
      const hasOriginalCart = localStorage.getItem(originalCartKey);
      
      // If we have temp checkout but no recent successful checkout, restore the cart
      if (hasTempCheckout && hasOriginalCart) {
        const recentCheckout = localStorage.getItem('recent_checkout_completed');
        if (recentCheckout !== 'true') {
          console.log('Restoring cart from incomplete checkout...');
          const originalCart = JSON.parse(localStorage.getItem(originalCartKey) || '[]');
          
          // Restore the original cart
          const cartKey = userData.id 
            ? `driftwear_cart_${userData.id}`
            : `driftwear_cart_guest`;
          
          localStorage.setItem(cartKey, JSON.stringify(originalCart));
          
          // Clear temp storage
          localStorage.removeItem(checkoutTempKey);
          localStorage.removeItem(originalCartKey);
          
          setCartItems(originalCart);
          calculateTotal(originalCart);
        } else {
          // Clear the flag for next time
          localStorage.removeItem('recent_checkout_completed');
        }
      }
    } catch (error) {
      console.error('Error checking cart restoration:', error);
    }
  };

  useEffect(() => {
    checkAuth();
    loadCart();
    loadWishlist();
    handleScroll();
    
    // Check if we need to restore cart from incomplete checkout
    restoreOriginalCartIfNeeded();
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    calculateSelectedTotal();
  }, [selectedItems, cartItems]);

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('driftwear_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    }
  };

  const loadCart = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      const cartKey = userData.id 
        ? `driftwear_cart_${userData.id}`
        : `driftwear_cart_guest`;
      
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      setCartItems(cart);
      calculateTotal(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      let wishlist = [];
      
      if (userData.id) {
        wishlist = JSON.parse(localStorage.getItem(`driftwear_wishlist_${userData.id}`) || '[]');
      } else {
        wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      }
      
      setWishlistItems(wishlist);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlistItems([]);
    }
  };

  const calculateTotal = (items) => {
    const subtotal = items.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
    
    const shipping = subtotal > 0 ? 5.99 : 0;
    const tax = subtotal * 0.08;
    const finalTotal = subtotal + shipping + tax;
    
    setTotal(finalTotal);
  };

  const calculateSelectedTotal = () => {
    if (selectedItems.length === 0) {
      setTotal(0);
      return;
    }

    const selectedCartItems = cartItems.filter(item => 
      selectedItems.includes(getItemKey(item))
    );

    const subtotal = selectedCartItems.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
    
    const shipping = subtotal > 0 ? 5.99 : 0;
    const tax = subtotal * 0.08;
    const finalTotal = subtotal + shipping + tax;
    
    setTotal(finalTotal);
  };

  // Generate unique key for each cart item
  const getItemKey = (item) => {
    const safeSize = item.size || 'M';
    const safeColor = item.color || 'Blue';
    return `${item.id}-${safeSize}-${safeColor}`;
  };

  // Toggle selection for individual item
  const toggleItemSelection = (itemKey) => {
    setSelectedItems(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(key => key !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  // Toggle select all items
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const allItemKeys = cartItems.map(item => getItemKey(item));
      setSelectedItems(allItemKeys);
    }
    setSelectAll(!selectAll);
  };

  // Check if an item is selected
  const isItemSelected = (item) => {
    return selectedItems.includes(getItemKey(item));
  };

  const updateQuantity = (productId, newQuantity, size = 'M', color = 'Blue') => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      const cartKey = userData.id 
        ? `driftwear_cart_${userData.id}`
        : `driftwear_cart_guest`;
      
      let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      // Find the exact item with matching ID, size, and color
      const itemIndex = cart.findIndex(item => 
        String(item.id) === String(productId) && 
        String(item.size || 'M') === String(size) && 
        String(item.color || 'Blue') === String(color)
      );
      
      if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        setCartItems([...cart]);
        calculateSelectedTotal();
        displayToast('Cart updated!');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      displayToast('Failed to update cart');
    }
  };

  const removeFromCart = (productId, size = 'M', color = 'Blue') => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      const cartKey = userData.id 
        ? `driftwear_cart_${userData.id}`
        : `driftwear_cart_guest`;
      
      let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      // Filter out the exact item with matching ID, size, and color
      const updatedCart = cart.filter(item => {
        return !(
          String(item.id) === String(productId) && 
          String(item.size || 'M') === String(size) && 
          String(item.color || 'Blue') === String(color)
        );
      });
      
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      
      setCartItems(updatedCart);
      
      // Remove from selected items if it was selected
      const removedItemKey = `${productId}-${size}-${color}`;
      setSelectedItems(prev => prev.filter(key => key !== removedItemKey));
      
      calculateSelectedTotal();
      displayToast('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      displayToast('Failed to remove item');
    }
  };

  // Remove selected items
  const removeSelectedItems = () => {
    if (selectedItems.length === 0) {
      displayToast('No items selected');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      const cartKey = userData.id 
        ? `driftwear_cart_${userData.id}`
        : `driftwear_cart_guest`;
      
      let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

      // Filter out selected items
      const updatedCart = cart.filter(item => {
        const itemKey = getItemKey(item);
        return !selectedItems.includes(itemKey);
      });
      
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      
      setCartItems(updatedCart);
      setSelectedItems([]);
      setSelectAll(false);
      calculateSelectedTotal();
      displayToast(`${selectedItems.length} item(s) removed from cart`);
    } catch (error) {
      console.error('Error removing selected items:', error);
      displayToast('Failed to remove items');
    }
  };

  // FIXED: Corrected proceedToCheckout function
  const proceedToCheckout = () => {
    if (selectedItems.length === 0) {
      displayToast('Please select items to checkout');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      // Get only the selected items for checkout
      const selectedCartItems = cartItems.filter(item => 
        selectedItems.includes(getItemKey(item))
      );

      if (selectedCartItems.length === 0) {
        displayToast('No items selected for checkout');
        return;
      }

      // Save current cart for potential restoration (but DON'T remove from cart yet)
      const currentCart = cartItems;
      
      // CRITICAL FIX: Save to checkout_temp WITHOUT removing from cart
      const checkoutTempKey = userData.id 
        ? `driftwear_checkout_temp_${userData.id}`
        : `driftwear_checkout_temp_guest`;
      
      const originalCartKey = userData.id 
        ? `driftwear_original_cart_${userData.id}`
        : `driftwear_original_cart_guest`;
      
      const cartKey = userData.id 
        ? `driftwear_cart_${userData.id}`
        : `driftwear_cart_guest`;
      
      // Save the selected items for checkout
      localStorage.setItem(checkoutTempKey, JSON.stringify(selectedCartItems));
      
      // Save the original cart for restoration if checkout fails
      localStorage.setItem(originalCartKey, JSON.stringify(currentCart));
      
      console.log('Saved to checkout_temp:', selectedCartItems.length, 'items');
      console.log('Saved original cart with', currentCart.length, 'items');
      console.log('Cart still has', cartItems.length, 'items (not removed yet)');
      console.log('Proceeding to checkout with', selectedCartItems.length, 'selected items');
      
      // Clear the recent checkout flag if it exists
      localStorage.removeItem('recent_checkout_completed');
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error in checkout:', error);
      displayToast('Failed to proceed to checkout');
    }
  };

  // FIXED: Corrected buyNow function
  const buyNow = (item) => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      // Create a temporary cart with only this item for checkout
      const tempCheckoutCart = [{ ...item, quantity: 1 }];
      
      // Save current cart for potential restoration (but DON'T remove from cart yet)
      const currentCart = cartItems;
      
      // Save to checkout_temp
      const checkoutTempKey = userData.id 
        ? `driftwear_checkout_temp_${userData.id}`
        : `driftwear_checkout_temp_guest`;
      
      const originalCartKey = userData.id 
        ? `driftwear_original_cart_${userData.id}`
        : `driftwear_original_cart_guest`;
      
      localStorage.setItem(checkoutTempKey, JSON.stringify(tempCheckoutCart));
      localStorage.setItem(originalCartKey, JSON.stringify(currentCart));
      
      // Clear the recent checkout flag if it exists
      localStorage.removeItem('recent_checkout_completed');
      
      console.log('Saved to checkout_temp for Buy Now: 1 item');
      console.log('Saved original cart with', currentCart.length, 'items');
      console.log('Cart still has', cartItems.length, 'items (not removed yet)');
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error in buy now:', error);
      displayToast('Failed to proceed with Buy Now');
    }
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const redirectToProducts = () => {
    navigate('/products');
  };

  const redirectToWishlist = () => {
    navigate('/wishlist');
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Social media links handler
  const handleSocialLink = (platform) => {
    displayToast(`Opening ${platform}...`);
  };

  // Footer link handlers
  const handleFooterLink = (section, link) => {
    displayToast(`Navigating to ${link}...`);
  };

  // Function to set ref for each cart item
  const setItemRef = (index) => (el) => {
    cartItemsRef.current[index] = el;
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '48px', color: 'var(--brand)' }}>🛒</div>
            <p style={{ marginTop: '20px' }}>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Top Bar */}
      <div className="top-bar">
        FREE SHIPPING ON ALL ORDERS OVER $50
      </div>

      {/* Header */}
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-main">
            <div className="header-left">
              <button className="profile-btn" onClick={redirectToProducts}>
                <i className="fas fa-user"></i>
              </button>
              <div className="logo">
                <span onClick={() => navigate('/')} style={{cursor: 'pointer'}}>DRIFTWEAR</span>
              </div>
            </div>
            
            <div className="header-center">
              {/* Search bar has been removed */}
            </div>
            
            <div className="header-actions">
              <button className="btn-profile" onClick={redirectToProducts}>
                <i className="fas fa-shopping-bag"></i>
                <span>Products</span>
              </button>
              
              <button className="icon-btn" onClick={redirectToWishlist}>
                <i className="fas fa-heart"></i>
                <span className="wishlist-count">{getWishlistCount()}</span>
              </button>
              <button className="icon-btn" onClick={() => navigate('/cart')}>
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-count">{getCartCount()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="container">
        <div className="page-title">
          <h1>Shopping Cart</h1>
          <div className="step-indicator">
            <div className="step active">
              <div className="step-number">1</div>
              <span>Cart</span>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <span>Checkout</span>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        {/* Cart Layout */}
        <div className="cart-layout">
          {/* Cart Items (Left Side) */}
          <div className="cart-content">
            {cartItems.length > 0 && (
              <div className="cart-actions">
                <div className="select-all">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all">
                    Select All ({selectedItems.length} of {cartItems.length} selected)
                  </label>
                </div>
                {selectedItems.length > 0 && (
                  <button 
                    className="btn-remove-selected"
                    onClick={removeSelectedItems}
                  >
                    <i className="fas fa-trash"></i>
                    Remove Selected ({selectedItems.length})
                  </button>
                )}
              </div>
            )}
            
            <div className="cart-items-container">
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <i className="fas fa-shopping-cart"></i>
                  <h2>Your cart is empty</h2>
                  <p>Looks like you haven't added anything to your cart yet.</p>
                  <button 
                    className="checkout-btn" 
                    onClick={() => navigate('/products')}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                cartItems.map((item, index) => {
                  const safeSize = item.size || 'M';
                  const safeColor = item.color || 'Blue';
                  const itemKey = getItemKey(item);
                  const isSelected = isItemSelected(item);
                  
                  // Build size and color info
                  let sizeColorInfo = '';
                  if (safeSize && safeSize !== 'Default') {
                    sizeColorInfo += `Size: ${safeSize}`;
                  }
                  if (safeColor && safeColor !== 'Default') {
                    sizeColorInfo += `${sizeColorInfo ? ', ' : ''}Color: ${safeColor}`;
                  }

                  return (
                    <div
                      key={itemKey}
                      ref={setItemRef(index)}
                      className={`cart-item-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(itemKey)}
                        />
                      </div>
                      <div className="item-image">
                        <img 
                          src={item.image || 'https://via.placeholder.com/300'} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x400/cccccc/ffffff?text=Image+Not+Found';
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          <p>{sizeColorInfo || 'Size: M, Color: Blue'}</p>
                          <div className="item-price">{formatPrice(item.price)}</div>
                          <div className="quantity-controls">
                            <button 
                              className="quantity-btn" 
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1, safeSize, safeColor)}
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="quantity-input" 
                              value={item.quantity || 1} 
                              min="1" 
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  updateQuantity(item.id, value, safeSize, safeColor);
                                }
                              }}
                            />
                            <button 
                              className="quantity-btn" 
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1, safeSize, safeColor)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button 
                            className="btn-buy" 
                            onClick={() => buyNow(item)}
                          >
                            <i className="fas fa-shopping-bag"></i> Buy Now
                          </button>
                          <button 
                            className="btn-delete" 
                            onClick={() => removeFromCart(item.id, safeSize, safeColor)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart Summary (Right Side) */}
          {cartItems.length > 0 && (
            <div className="cart-sidebar">
              <div className="cart-summary">
                <div className="summary-header">
                  <h3>Order Summary</h3>
                  <span>{selectedItems.length} item(s) selected</span>
                </div>
                
                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                
                <button 
                  className={`checkout-btn ${selectedItems.length === 0 ? 'disabled' : ''}`}
                  onClick={proceedToCheckout}
                  disabled={selectedItems.length === 0}
                >
                  {selectedItems.length === 0 ? 'Select Items to Checkout' : `Checkout (${selectedItems.length} items)`}
                </button>
                
                <button 
                  className="continue-shopping" 
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>DRIFTWEAR</h3>
              <p style={{opacity: '0.8', marginBottom: '20px', fontSize: '14px'}}>Premium clothing for everyone. Quality, style, and comfort in one place.</p>
              <div className="social-links">
                <a href="#" onClick={(e) => { e.preventDefault(); handleSocialLink('Facebook'); }}>
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleSocialLink('Instagram'); }}>
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleSocialLink('Twitter'); }}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleSocialLink('Pinterest'); }}>
                  <i className="fab fa-pinterest"></i>
                </a>
              </div>
            </div>
            
            <div className="footer-column">
              <h3>Shop</h3>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Shop', "Men's Clothing"); }}>Men's Clothing</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Shop', "Women's Clothing"); }}>Women's Clothing</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Shop', "Kids' Clothing"); }}>Kids' Clothing</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Shop', 'Accessories'); }}>Accessories</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Shop', 'New Arrivals'); }}>New Arrivals</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Company</h3>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Company', 'About Us'); }}>About Us</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Company', 'Careers'); }}>Careers</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Company', 'Privacy Policy'); }}>Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Company', 'Terms of Service'); }}>Terms of Service</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Company', 'Sitemap'); }}>Sitemap</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Customer Service</h3>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Customer Service', 'Contact Us'); }}>Contact Us</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Customer Service', 'FAQs'); }}>FAQs</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Customer Service', 'Shipping & Returns'); }}>Shipping & Returns</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Customer Service', 'Size Guide'); }}>Size Guide</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleFooterLink('Customer Service', 'Track Order'); }}>Track Order</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 DRIFTWEAR. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastVisible && (
        <div className="toast show">
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Cart;