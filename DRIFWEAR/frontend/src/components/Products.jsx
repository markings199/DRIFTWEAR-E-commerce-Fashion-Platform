import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Products.css';

function Products({ openAuthModal, currentUser }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('women');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const productCardsRef = useRef([]);
  const observerRef = useRef(null);

  const navigate = useNavigate();

  // Product data structure
  const productsData = {
    women: [
      { id: 1, name: "Classic Fit T-Shirt", price: 29.99, oldPrice: 39.99, image: "/images/women1.jpeg", badge: "New", category: "women" },
      { id: 2, name: "Slim Fit Jeans", price: 49.99, oldPrice: 59.99, image: "/images/women2.jpeg", category: "women" },
      { id: 3, name: "Hooded Jacket", price: 79.99, oldPrice: 99.99, image: "/images/women3.jpeg", badge: "Sale", category: "women" },
      { id: 4, name: "Casual Linen Shirt", price: 44.99, oldPrice: 54.99, image: "/images/women4.jpeg", category: "women" },
      { id: 5, name: "Premium Denim Jacket", price: 89.99, oldPrice: 109.99, image: "/images/women5.jpeg", badge: "New", category: "women" },
      { id: 6, name: "Classic Chino Pants", price: 39.99, oldPrice: 49.99, image: "/images/women6.jpeg", category: "women" },
      { id: 7, name: "Premium Leather Belt", price: 34.99, oldPrice: 44.99, image: "/images/women7.jpeg", category: "women" },
      { id: 8, name: "Sport Utility Shorts", price: 32.99, oldPrice: 42.99, image: "/images/women8.jpeg", badge: "Sale", category: "women" },
      { id: 9, name: "Classic Oxford Shirt", price: 49.99, oldPrice: 59.99, image: "/images/women9.jpeg", category: "women" },
      { id: 10, name: "Wool Blend Sweater", price: 69.99, oldPrice: 89.99, image: "/images/women10.jpeg", badge: "New", category: "women" },
      { id: 11, name: "Women's Summer Dress", price: 54.99, oldPrice: 64.99, image: "/images/women11.jpeg", category: "women" },
      { id: 12, name: "Women's Trench Coat", price: 129.99, oldPrice: 159.99, image: "/images/women12.jpeg", badge: "Sale", category: "women" }
    ],
    men: [
      { id: 13, name: "Men's Slim Fit Shirt", price: 39.99, oldPrice: 49.99, image: "/images/men2.jpeg", badge: "New", category: "men" },
      { id: 14, name: "Men's Cargo Pants", price: 49.99, oldPrice: 59.99, image: "/images/men3.jpeg", category: "men" },
      { id: 15, name: "Men's Leather Jacket", price: 89.99, oldPrice: 109.99, image: "/images/men4.jpeg", badge: "Sale", category: "men" },
      { id: 16, name: "Men's Casual Polo", price: 34.99, oldPrice: 44.99, image: "/images/men5.jpeg", category: "men" },
      { id: 17, name: "Men's Wool Coat", price: 99.99, oldPrice: 129.99, image: "/images/men6.jpeg", badge: "New", category: "men" },
      { id: 18, name: "Men's Chino Shorts", price: 29.99, oldPrice: 39.99, image: "/images/men7.jpeg", category: "men" },
      { id: 19, name: "Men's Denim Shirt", price: 44.99, oldPrice: 54.99, image: "/images/men8.jpeg", badge: "Sale", category: "men" },
      { id: 20, name: "Men's Track Jacket", price: 59.99, oldPrice: 69.99, image: "/images/men9.jpeg", category: "men" },
      { id: 21, name: "Men's Flannel Shirt", price: 39.99, oldPrice: 49.99, image: "/images/men10.jpeg", badge: "New", category: "men" },
      { id: 22, name: "Men's Winter Parka", price: 119.99, oldPrice: 149.99, image: "/images/men11.jpeg", category: "men" }
    ],
    kids: [
      { id: 23, name: "Kids Graphic Tee", price: 19.99, oldPrice: 24.99, image: "/images/kids1.jpeg", badge: "New", category: "kids" },
      { id: 24, name: "Kids Denim Overalls", price: 24.99, oldPrice: 29.99, image: "/images/kids2.jpeg", category: "kids" },
      { id: 25, name: "Kids Hooded Jacket", price: 29.99, oldPrice: 34.99, image: "/images/kids3.jpeg", badge: "Sale", category: "kids" },
      { id: 26, name: "Kids Jogger Pants", price: 19.99, oldPrice: 24.99, image: "/images/kids4.jpeg", category: "kids" },
      { id: 27, name: "Kids Sweater", price: 22.99, oldPrice: 27.99, image: "/images/kids5.jpeg", badge: "New", category: "kids" },
      { id: 28, name: "Kids Rain Boots", price: 18.99, oldPrice: 22.99, image: "/images/kids6.jpeg", category: "kids" },
      { id: 29, name: "Kids Backpack", price: 15.99, oldPrice: 19.99, image: "/images/kids7.jpeg", badge: "Sale", category: "kids" },
      { id: 30, name: "Kids Swim Shorts", price: 14.99, oldPrice: 18.99, image: "/images/kids8.jpeg", category: "kids" },
      { id: 31, name: "Kids Pajama Set", price: 17.99, oldPrice: 21.99, image: "/images/kids9.jpeg", badge: "New", category: "kids" },
      { id: 32, name: "Kids Baseball Cap", price: 12.99, oldPrice: 16.99, image: "/images/kids10.jpeg", category: "kids" }
    ],
    baby: [
      { id: 33, name: "Baby Bodysuit Set", price: 19.99, oldPrice: 24.99, image: "/images/baby1.jpeg", badge: "New", category: "baby" },
      { id: 34, name: "Baby Romper", price: 24.99, oldPrice: 29.99, image: "/images/baby2.jpeg", category: "baby" },
      { id: 35, name: "Baby Hooded Towel", price: 29.99, oldPrice: 34.99, image: "/images/baby3.jpeg", badge: "Sale", category: "baby" },
      { id: 36, name: "Baby Sleepsack", price: 19.99, oldPrice: 24.99, image: "/images/baby4.jpeg", category: "baby" },
      { id: 37, name: "Baby Knit Cardigan", price: 22.99, oldPrice: 27.99, image: "/images/baby5.jpeg", badge: "New", category: "baby" },
      { id: 38, name: "Baby Booties", price: 18.99, oldPrice: 22.99, image: "/images/baby6.jpeg", category: "baby" },
      { id: 39, name: "Baby Bib Set", price: 15.99, oldPrice: 19.99, image: "/images/baby7.jpeg", badge: "Sale", category: "baby" },
      { id: 40, name: "Baby Sun Hat", price: 14.99, oldPrice: 18.99, image: "/images/baby8.jpeg", category: "baby" },
      { id: 41, name: "Baby Footed Pajamas", price: 17.99, oldPrice: 21.99, image: "/images/baby9.jpeg", badge: "New", category: "baby" },
      { id: 42, name: "Baby Mittens", price: 12.99, oldPrice: 16.99, image: "/images/baby10.jpeg", category: "baby" }
    ]
  };

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

    // Observe all product cards
    productCardsRef.current.forEach(card => {
      if (card) {
        observerRef.current.observe(card);
      }
    });
  };

  // Reset animations when products change
  const resetProductAnimations = () => {
    productCardsRef.current.forEach(card => {
      if (card) {
        card.classList.remove('animate-in');
      }
    });
    
    // Re-initialize observer after a small delay to ensure DOM is updated
    setTimeout(() => {
      initIntersectionObserver();
    }, 100);
  };

  useEffect(() => {
    checkAuth();
    loadProducts();
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    filterProducts();
  }, [activeCategory, searchTerm]);

  // Initialize animations when products are loaded or changed
  useEffect(() => {
    if (products.length > 0 && !isTransitioning) {
      resetProductAnimations();
    }
  }, [products, isTransitioning]);

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('driftwear_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        loadUserData(user);
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    }
  };

  const loadUserData = (userData) => {
    if (userData?.id) {
      try {
        const userCart = localStorage.getItem(`driftwear_cart_${userData.id}`);
        const userWishlist = localStorage.getItem(`driftwear_wishlist_${userData.id}`);
        
        const cart = userCart ? JSON.parse(userCart) : [];
        const wishlist = userWishlist ? JSON.parse(userWishlist) : [];
        
        setCartCount(cart.reduce((total, item) => total + (item.quantity || 0), 0));
        setWishlistCount(wishlist.length);
      } catch (error) {
        console.error('Error loading user data:', error);
        setCartCount(0);
        setWishlistCount(0);
      }
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  };

  const loadProducts = () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const filterProducts = () => {
    const categoryProducts = productsData[activeCategory] || [];
    if (!searchTerm.trim()) {
      setProducts(categoryProducts);
    } else {
      const filtered = categoryProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProducts(filtered);
    }
  };

  const requireAuth = (action) => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 5000);
      return false;
    }
    return true;
  };

  const handleAddToCart = (productId, category) => {
    if (!requireAuth('add to cart')) return;

    try {
      const product = productsData[category]?.find(p => p.id === productId);
      if (!product) return;

      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      if (!userData.id) return;

      let cart = JSON.parse(localStorage.getItem(`driftwear_cart_${userData.id}`) || '[]');
      
      const existingItem = cart.find(item => item.id === productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        });
      }
      
      localStorage.setItem(`driftwear_cart_${userData.id}`, JSON.stringify(cart));
      setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
      displayToast('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      displayToast('Failed to add product to cart');
    }
  };

  const handleToggleWishlist = (productId, category) => {
    if (!requireAuth('manage wishlist')) return;

    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      if (!userData.id) return;

      let wishlist = JSON.parse(localStorage.getItem(`driftwear_wishlist_${userData.id}`) || '[]');
      const existingItem = wishlist.find(item => item.id === productId);
      
      if (existingItem) {
        wishlist = wishlist.filter(item => item.id !== productId);
        displayToast('Product removed from wishlist!');
      } else {
        const product = productsData[category]?.find(p => p.id === productId);
        if (product) {
          wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
          });
          displayToast('Product added to wishlist!');
        }
      }
      
      localStorage.setItem(`driftwear_wishlist_${userData.id}`, JSON.stringify(wishlist));
      setWishlistCount(wishlist.length);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      displayToast('Failed to update wishlist');
    }
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const viewDetails = (productId, category) => {
    const product = productsData[category]?.find(p => p.id === productId);
    if (product) {
      localStorage.setItem('currentProduct', JSON.stringify(product));
      navigate(`/product/${productId}`, { 
        state: { product } 
      });
    }
  };

  // FIXED: Customize function now navigates to the customization page
  const handleCustomize = () => {
    if (!requireAuth('customize products')) return;
    navigate('/customization');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      filterProducts();
    }
  };

  const handleCategoryChange = async (category) => {
    setIsTransitioning(true);
    
    // Wait for fade-out animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setActiveCategory(category);
    setSearchTerm('');
    
    // Wait for fade-in animation
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTransitioning(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const isProductWishlisted = (productId) => {
    if (!user) return false;
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const wishlist = JSON.parse(localStorage.getItem(`driftwear_wishlist_${userData.id}`) || '[]');
      return wishlist.some(item => item.id === productId);
    } catch (error) {
      return false;
    }
  };

  const redirectToCart = () => {
    navigate('/cart');
  };

  const redirectToWishlist = () => {
    if (!requireAuth('view wishlist')) return;
    navigate('/wishlist');
  };

  const redirectToProfile = () => {
    navigate('/');
  };

  const categories = [
    { key: 'women', label: 'Women' },
    { key: 'men', label: 'Men' },
    { key: 'kids', label: 'Kids' },
    { key: 'baby', label: 'Baby' }
  ];

  // Function to set product card ref
  const setProductCardRef = (el, index) => {
    productCardsRef.current[index] = el;
  };

  if (loading) {
    return (
      <div className="products-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '48px', color: 'var(--brand)' }}>⏳</div>
            <p style={{ marginTop: '20px' }}>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* White Overlay for Page Transition */}
      <div className={`white-overlay ${!loading ? 'hidden' : ''}`}></div>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="login-prompt">
          <p>You need to log in to use this feature</p>
          <button className="btn" onClick={redirectToProfile}>Sign In</button>
        </div>
      )}

      {/* Top Bar */}
      <div className="top-bar">
        FREE SHIPPING ON ALL ORDERS OVER $50
      </div>

      {/* Header */}
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-main">
            <div className="header-left">
              <button className="profile-btn" onClick={redirectToProfile}>
                <i className="fas fa-user"></i>
              </button>
              <div className="logo">
                <span onClick={() => navigate('/')} style={{cursor: 'pointer'}}>DRIFTWEAR</span>
              </div>
            </div>
            
            <div className="header-center">
              <div className="search-bar">
                <i className="fas fa-search" onClick={handleSearch} style={{cursor: 'pointer'}}></i>
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={handleSearch}
                />
              </div>
            </div>
            
            <div className="header-actions">
              <button className="btn-profile" onClick={redirectToProfile}>
                <i className="fas fa-user"></i>
                <span>Profile</span>
              </button>
              
              <button className="icon-btn" onClick={redirectToWishlist}>
                <i className="fas fa-heart"></i>
                <span className="wishlist-count">{wishlistCount}</span>
              </button>
              <button className="icon-btn" onClick={redirectToCart}>
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-count">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="container">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.key}
              className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.key)}
            >
              {category.label}
            </button>
          ))}
          <button className="category-tab btn-customize-tab" onClick={handleCustomize}>
            <i className="fas fa-palette"></i> Customize
          </button>
        </div>
      </div>

      {/* Products Section */}
      <section className="section" id="products-section">
        <div className="container">
          <h2 className="section-title">All Products</h2>
          
          <div className={`products category-content ${isTransitioning ? 'fade-out' : 'fade-in'}`} id="products-container">
            {products.length === 0 ? (
              <div className="no-results">
                <i className="fas fa-search" style={{fontSize: '48px', marginBottom: '20px', opacity: '0.5'}}></i>
                <h3>No products found</h3>
                <p>Try adjusting your search terms or browse other categories.</p>
              </div>
            ) : (
              products.map((product, index) => {
                const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
                const isWishlisted = isProductWishlisted(product.id);

                return (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => viewDetails(product.id, product.category)}
                    ref={(el) => setProductCardRef(el, index)}
                  >
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
                      <div className="product-price">
                        <span className="current-price">{formatPrice(product.price)}</span>
                        {product.oldPrice && (
                          <span className="old-price">{formatPrice(product.oldPrice)}</span>
                        )}
                        {discount > 0 && (
                          <span className="discount">{discount}% OFF</span>
                        )}
                      </div>
                      <div className="product-actions">
                        <button
                          className="btn-cart"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product.id, product.category);
                          }}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="btn-wishlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id, product.category);
                          }}
                        >
                          <i 
                            className="fas fa-heart" 
                            style={{ color: isWishlisted ? '#ff4d4d' : 'var(--text)' }}
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>DRIFTWEAR</h3>
              <p style={{opacity: '0.8', marginBottom: '20px', fontSize: '14px'}}>Premium clothing for everyone. Quality, style, and comfort in one place.</p>
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
                <li><a href="#">Men's Clothing</a></li>
                <li><a href="#">Women's Clothing</a></li>
                <li><a href="#">Kids' Clothing</a></li>
                <li><a href="#">Accessories</a></li>
                <li><a href="#">New Arrivals</a></li>
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
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Shipping & Returns</a></li>
                <li><a href="#">Size Guide</a></li>
                <li><a href="#">Track Order</a></li>
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

export default Products;