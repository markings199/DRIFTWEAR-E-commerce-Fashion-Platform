import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../css/ProductDetail.css';

function ProductDetail({ openAuthModal, currentUser }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [customSize, setCustomSize] = useState({ length: '', width: '', notes: '' });
  const [aiRecommendation, setAiRecommendation] = useState({ age: '', gender: '', height: '', weight: '' });
  const [showAiResult, setShowAiResult] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [actionType, setActionType] = useState(''); // 'addToCart' or 'buyNow'

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Mock product data matching your structure
  const mockProducts = {
    women: [
      { 
        id: 1, 
        name: "Classic Fit T-Shirt", 
        price: 29.99, 
        oldPrice: 39.99, 
        image: "/images/women1.jpeg", 
        badge: "NEW",
        description: "Experience ultimate comfort with our premium cotton t-shirt. Made from 100% high-quality cotton, this t-shirt offers a perfect blend of style and comfort. Ideal for everyday wear, it features a classic fit that suits all body types.",
        images: [
          "/images/women1.jpeg",
          "/images/women2.jpeg",
          "/images/women3.jpeg",
          "/images/women4.jpeg"
        ],
        colors: [
          { name: "Black", value: "#000000" },
          { name: "White", value: "#ffffff" },
          { name: "Navy Blue", value: "#1e3a8a" },
          { name: "Forest Green", value: "#166534" }
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        unavailableSizes: ["XXL"],
        material: "100% Premium Cotton",
        care: "Machine wash cold, tumble dry low",
        fit: "Regular Fit",
        origin: "Imported"
      },
      { 
        id: 2, 
        name: "Slim Fit Jeans", 
        price: 49.99, 
        oldPrice: 59.99, 
        image: "/images/women2.jpeg",
        badge: "NEW",
        description: "Stylish slim fit jeans with stretch for maximum comfort. Perfect for casual and semi-formal occasions.",
        images: [
          "/images/women2.jpeg",
          "/images/women1.jpeg",
          "/images/women3.jpeg"
        ],
        colors: [
          { name: "Dark Blue", value: "#1e3a8a" },
          { name: "Black", value: "#000000" }
        ],
        sizes: ["28", "30", "32", "34"],
        unavailableSizes: [],
        material: "98% Cotton, 2% Elastane",
        care: "Machine wash cold, hang to dry",
        fit: "Slim Fit",
        origin: "Imported"
      },
      { 
        id: 3, 
        name: "Hooded Jacket", 
        price: 79.99, 
        oldPrice: 99.99, 
        image: "/images/women3.jpeg",
        badge: "SALE",
        description: "Warm and stylish hooded jacket perfect for cool weather. Features multiple pockets and adjustable hood.",
        images: [
          "/images/women3.jpeg",
          "/images/women1.jpeg"
        ],
        colors: [
          { name: "Black", value: "#000000" },
          { name: "Gray", value: "#6b7280" },
          { name: "Navy", value: "#1e3a8a" }
        ],
        sizes: ["S", "M", "L", "XL"],
        unavailableSizes: [],
        material: "Polyester Blend",
        care: "Machine wash cold",
        fit: "Regular Fit",
        origin: "Imported"
      },
      { 
        id: 4, 
        name: "Casual Linen Shirt", 
        price: 44.99, 
        oldPrice: 54.99, 
        image: "/images/women4.jpeg",
        badge: "NEW",
        description: "Lightweight linen shirt perfect for summer. Breathable fabric with a relaxed fit.",
        images: [
          "/images/women4.jpeg",
          "/images/women1.jpeg"
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Beige", value: "#d4b483" },
          { name: "Light Blue", value: "#93c5fd" }
        ],
        sizes: ["XS", "S", "M", "L"],
        unavailableSizes: [],
        material: "100% Linen",
        care: "Hand wash recommended",
        fit: "Relaxed Fit",
        origin: "Imported"
      }
    ],
    men: [
      { 
        id: 13, 
        name: "Men's Slim Fit Shirt", 
        price: 39.99, 
        oldPrice: 49.99, 
        image: "/images/men2.jpeg", 
        badge: "NEW",
        description: "Formal shirt with premium cotton blend. Perfect for office wear or special occasions.",
        images: [
          "/images/men2.jpeg",
          "/images/men3.jpeg"
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Blue", value: "#3b82f6" },
          { name: "Gray", value: "#6b7280" }
        ],
        sizes: ["S", "M", "L", "XL"],
        unavailableSizes: [],
        material: "100% Cotton",
        care: "Machine wash warm, iron as needed",
        fit: "Slim Fit",
        origin: "Imported"
      }
    ],
    kids: [
      { 
        id: 23, 
        name: "Kids Graphic Tee", 
        price: 19.99, 
        oldPrice: 24.99, 
        image: "/images/kids1.jpeg", 
        badge: "NEW",
        description: "Fun and comfortable graphic tee for kids, made from soft cotton blend. Perfect for everyday wear and play.",
        images: [
          "/images/kids1.jpeg",
          "/images/kids2.jpeg"
        ],
        colors: [
          { name: "Blue", value: "#3b82f6" },
          { name: "Red", value: "#dc2626" },
          { name: "Green", value: "#16a34a" }
        ],
        sizes: ["XS", "S", "M", "L"],
        unavailableSizes: [],
        material: "100% Cotton",
        care: "Machine wash cold",
        fit: "Regular Fit",
        origin: "Imported"
      }
    ],
    baby: [
      { 
        id: 33, 
        name: "Baby Bib Set", 
        price: 15.99, 
        oldPrice: 19.99, 
        image: "/images/baby1.jpeg", 
        badge: "SALE",
        description: "Soft and comfortable bodysuit set for your little one. Made from gentle, breathable fabric.",
        images: [
          "/images/baby1.jpeg",
          "/images/baby2.jpeg"
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Pink", value: "#ec4899" },
          { name: "Blue", value: "#3b82f6" }
        ],
        sizes: ["0-3M", "3-6M", "6-9M", "9-12M"],
        unavailableSizes: [],
        material: "100% Cotton",
        care: "Machine wash gentle",
        fit: "Regular Fit",
        origin: "Imported"
      }
    ]
  };

  useEffect(() => {
    checkAuth();
    loadProduct();
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, location.state]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (showLoginPrompt) {
      const timer = setTimeout(() => setShowLoginPrompt(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showLoginPrompt]);

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('driftwear_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        loadUserData(user);
      }
    } catch (error) {
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

  const loadProduct = () => {
    setLoading(true);
    
    // Try to get product from navigation state first
    if (location.state?.product) {
      setProduct(location.state.product);
      setLoading(false);
      return;
    }

    // Try to get from localStorage
    try {
      const storedProduct = localStorage.getItem('currentProduct');
      if (storedProduct) {
        const parsedProduct = JSON.parse(storedProduct);
        setProduct(parsedProduct);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('No product in localStorage');
    }

    // Otherwise, search through all categories
    let foundProduct = null;

    for (const category in mockProducts) {
      const categoryProduct = mockProducts[category].find(p => p.id === parseInt(id));
      if (categoryProduct) {
        foundProduct = categoryProduct;
        break;
      }
    }

    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      // Product not found, redirect to products page
      navigate('/products');
    }
    
    setLoading(false);
  };

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const requireAuth = (action) => {
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  // NEW FUNCTION: Handle login/signup redirect
  const handleAuthRedirect = (authType) => {
    // Close the login prompt
    setShowLoginPrompt(false);
    
    // If openAuthModal prop is provided, use it
    if (openAuthModal) {
      openAuthModal(authType);
    } else {
      // Otherwise, redirect to home page
      navigate('/');
    }
  };

  // FIXED: Handle Add to Cart with proper size selection
  const handleAddToCart = () => {
    if (!requireAuth('add to cart')) return;
    setActionType('addToCart');
    setShowSizeModal(true);
  };

  // FIXED: Handle Buy Now with proper size selection
  const handleBuyNow = () => {
    if (!requireAuth('buy now')) return;
    setActionType('buyNow');
    setShowSizeModal(true);
  };

  // FIXED: Confirm size selection and proceed with the action
  const confirmSizeSelection = () => {
    // If AI recommendation is selected but no result, show error
    if (selectedSize === 'AI' && !showAiResult) {
      displayToast('Please get an AI recommendation first');
      return;
    }
    
    // If custom size is selected but no measurements, show error
    if (selectedSize === 'Custom' && (!customSize.length || !customSize.width)) {
      displayToast('Please enter both length and width for custom size');
      return;
    }
    
    // If no size selected at all
    if (!selectedSize) {
      displayToast('Please select a size');
      return;
    }
    
    // Add to cart first
    addToCartWithSize();
    
    // Then handle the specific action
    if (actionType === 'buyNow') {
      // For Buy Now, navigate to checkout
      navigateToCheckout();
    }
    
    setShowSizeModal(false);
  };

  // FIXED: Add to cart function with proper error handling
  const addToCartWithSize = async () => {
    try {
      console.log('Starting addToCartWithSize...');
      
      // Safety check
      if (!product) {
        displayToast('Product information is missing');
        return;
      }
      
      const selectedColorObj = product.colors?.[selectedColor] || { name: 'Default' };
      let sizeToUse = selectedSize;
      
      console.log('Selected size:', selectedSize);
      console.log('Selected color:', selectedColorObj);
      
      if (selectedSize === 'Custom') {
        sizeToUse = `Custom (${customSize.length}" x ${customSize.width}")`;
        if (customSize.notes) {
          sizeToUse += ` - ${customSize.notes}`;
        }
      }
      
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      console.log('User data:', userData);
      
      if (!userData.id) {
        console.log('No user ID found');
        displayToast('Please log in to add items to cart');
        return;
      }

      let cart = JSON.parse(localStorage.getItem(`driftwear_cart_${userData.id}`) || '[]');
      console.log('Current cart:', cart);
      
      const existingItem = cart.find(item => 
        item.id === product.id && 
        item.size === sizeToUse && 
        item.color === selectedColorObj.name
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
        console.log('Updated existing item:', existingItem);
      } else {
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size: sizeToUse,
          color: selectedColorObj.name,
          quantity: quantity
        };
        cart.push(newItem);
        console.log('Added new item:', newItem);
      }
      
      localStorage.setItem(`driftwear_cart_${userData.id}`, JSON.stringify(cart));
      console.log('Cart saved to localStorage');
      
      // Update cart count
      loadUserData(userData);
      
      // Show success message
      displayToast(`Added ${quantity} ${product.name} (${selectedColorObj.name}, ${sizeToUse}) to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      displayToast('Failed to add product to cart');
    }
  };

  // NEW: Navigate to checkout for Buy Now
  const navigateToCheckout = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      
      // Get the current cart to save as original cart
      const currentCart = JSON.parse(localStorage.getItem(`driftwear_cart_${userData.id}`) || '[]');
      
      // Save original cart to restore later if needed
      localStorage.setItem(`driftwear_original_cart_${userData.id}`, JSON.stringify(currentCart));
      
      console.log('Proceeding to checkout...');
      navigate('/checkout');
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      displayToast('Failed to proceed to checkout');
    }
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const openChat = () => {
    if (!requireAuth('chat with seller')) return;
    setShowChatModal(true);
    // Initialize chat with welcome message
    setChatMessages([
      {
        id: 1,
        type: 'seller',
        content: "Hello! I'm your AI assistant. How can I help you with our products today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(newMessage, product);
      const sellerMessage = {
        id: Date.now() + 1,
        type: 'seller',
        content: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, sellerMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage, product) => {
    const message = userMessage.toLowerCase();
    
    if (product) {
      if (message.includes('size') || message.includes('fit')) {
        return `The ${product.name} comes in sizes: ${product.sizes.join(', ')}. Our size chart is accurate, but if you're between sizes, I'd recommend going with the larger size for a more comfortable fit.`;
      }
      
      if (message.includes('color') || message.includes('colour')) {
        return `The ${product.name} is available in these colors: ${product.colors.map(c => c.name).join(', ')}. The product images show the colors accurately.`;
      }
      
      if (message.includes('material') || message.includes('fabric')) {
        return `The ${product.name} is made from ${product.material}. ${product.description}`;
      }
      
      if (message.includes('price') || message.includes('cost')) {
        if (product.oldPrice) {
          const discount = Math.round((1 - product.price / product.oldPrice) * 100);
          return `The ${product.name} is currently $${product.price}, down from $${product.oldPrice} (${discount}% off). This is a limited-time offer!`;
        }
        return `The ${product.name} is priced at $${product.price}. We believe this offers excellent value for the quality you're getting.`;
      }
    }
    
    // General responses
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! I'm your AI shopping assistant. How can I help you with our products today?";
    }
    
    if (message.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    return "Thank you for your question! I'd be happy to help. Could you please provide more details so I can give you the best answer?";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (!product.oldPrice) return 0;
    return Math.round((1 - product.price / product.oldPrice) * 100);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (size !== 'Custom') {
      setCustomSize({ length: '', width: '', notes: '' });
    }
    if (size !== 'AI') {
      setAiRecommendation({ age: '', gender: '', height: '', weight: '' });
      setShowAiResult(false);
    }
  };

  const handleCustomSizeChange = (field, value) => {
    setCustomSize(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAiRecommendationChange = (field, value) => {
    setAiRecommendation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAIRecommendation = async () => {
    const { age, gender, height, weight } = aiRecommendation;
    
    if (!age || !gender || !height || !weight) {
      displayToast('Please fill in all required fields: Age, Gender, Height, and Weight');
      return;
    }

    // Simulate AI recommendation
    setTimeout(() => {
      // Determine recommended size based on inputs
      let recommendedSize = 'M'; // Default
      if (height > 180 && weight > 80) recommendedSize = 'L';
      else if (height < 160 && weight < 50) recommendedSize = 'S';
      
      const recommendation = `Based on your measurements, we recommend a ${recommendedSize} size. This should provide a comfortable fit for your body type.`;
      setAiResult(recommendation);
      setShowAiResult(true);
      
      // Auto-select the recommended size
      setSelectedSize(recommendedSize);
    }, 2000);
  };

  const redirectToCart = () => {
    navigate('/cart');
  };

  const redirectToWishlist = () => {
    if (!requireAuth('view wishlist')) return;
    navigate('/wishlist');
  };

  const redirectToProducts = () => {
    navigate('/products');
  };

  // Reset size modal when closed
  const handleSizeModalClose = () => {
    setShowSizeModal(false);
    setSelectedSize(null);
    setCustomSize({ length: '', width: '', notes: '' });
    setAiRecommendation({ age: '', gender: '', height: '', weight: '' });
    setShowAiResult(false);
    setActionType('');
  };

  if (loading) {
    return (
      <div className="product-loading">
        <div className="container">
          <div className="loading-content">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <div className="not-found-content">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist.</p>
            <button className="btn-primary" onClick={() => navigate('/products')}>
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discount = getDiscountPercentage();

  return (
    <div className="product-detail-page">
      {/* Updated Login Prompt - Now on Left Side */}
      {showLoginPrompt && (
        <div className="login-prompt">
          <div className="login-prompt-content">
            <h4>Authentication Required</h4>
            <p>You need to log in to use this feature</p>
            <div className="login-prompt-buttons">
              <button 
                className="login-prompt-btn primary" 
                onClick={() => handleAuthRedirect('login')}
              >
                Log In
              </button>
              <button 
                className="login-prompt-btn secondary" 
                onClick={() => handleAuthRedirect('signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
          <button 
            className="login-prompt-close" 
            onClick={() => setShowLoginPrompt(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${showToast ? 'show' : ''}`}>
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Professional Header */}
      <div className="top-bar">
        FREE SHIPPING ON ALL ORDERS OVER $50
      </div>

      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-main">
            <div className="header-left">
              <button className="profile-btn" onClick={redirectToProducts}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="logo">
                <span onClick={() => navigate('/')} style={{cursor: 'pointer'}}>DRIFTWEAR</span>
              </div>
            </div>
            
            <div className="header-center">
              <div className="search-bar">
                <i className="fas fa-search" style={{cursor: 'pointer'}}></i>
                <input 
                  type="text" 
                  placeholder="Search products..."
                />
              </div>
            </div>
            
            {/* Updated Header Actions with Visible Products Button */}
            <div className="header-actions">
              <button className="products-btn" onClick={redirectToProducts}>
                <i className="fas fa-store"></i>
                <span>Products</span>
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

      {/* Breadcrumb */}
      <div className="container">
        <div className="breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> 
          {' > '}
          <a href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>Products</a>
          {' > '}
          <span>{product.name}</span>
        </div>
      </div>

      {/* Product Detail Section */}
      <div className="container">
        <div className="product-detail">
          {/* Product Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images ? product.images[selectedImage] : product.image} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x600/cccccc/ffffff?text=Image+Not+Found';
                }}
              />
              {product.badge && (
                <div className={`product-badge ${product.badge.toLowerCase()}`}>
                  {product.badge}
                </div>
              )}
            </div>
            <div className="image-thumbnails">
              {(product.images || [product.image]).map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} view ${index + 1}`}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100/cccccc/ffffff?text=Image';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-brand">DRIFTWEAR</div>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="old-price">{formatPrice(product.oldPrice)}</span>
              )}
              {discount > 0 && (
                <span className="discount-badge">{discount}% OFF</span>
              )}
            </div>
            
            <div className="product-meta">
              <div className="meta-item">
                <i className="fas fa-star"></i>
                <span>4.8 (127 reviews)</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-shopping-bag"></i>
                <span>152 sold</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>In stock</span>
              </div>
            </div>
            
            {/* Color Selection */}
            <div className="selector-group">
              <div className="selector-title">Color</div>
              <div className="color-options">
                {(product.colors || [{ name: 'Default', value: '#666666' }]).map((color, index) => (
                  <div
                    key={index}
                    className={`color-option ${selectedColor === index ? 'selected' : ''}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    onClick={() => setSelectedColor(index)}
                  />
                ))}
              </div>
            </div>
            
            {/* Quantity Selection */}
            <div className="selector-group">
              <div className="selector-title">Quantity</div>
              <div className="quantity-controls">
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange(-1)}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className="quantity-input" 
                  value={quantity}
                  min="1"
                  max="10"
                  readOnly
                />
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-primary" onClick={handleAddToCart}>
                <i className="fas fa-shopping-cart"></i> Add to Cart
              </button>
              <button className="btn-secondary" onClick={handleBuyNow}>
                <i className="fas fa-bolt"></i> Buy Now
              </button>
            </div>
            
            <button className="chat-seller-btn" onClick={openChat}>
              <i className="fas fa-comments"></i> Chat with Seller
            </button>
            
            {/* Shipping Info */}
            <div className="shipping-info">
              <div className="shipping-item">
                <i className="fas fa-shipping-fast"></i>
                <span>Free shipping for orders over $50</span>
              </div>
              <div className="shipping-item">
                <i className="fas fa-store"></i>
                <span>Click & Collect available</span>
              </div>
              <div className="shipping-item">
                <i className="fas fa-undo"></i>
                <span>Free returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="product-tabs">
          <div className="tab-headers">
            <div 
              className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </div>
            <div 
              className={`tab-header ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </div>
            <div 
              className={`tab-header ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews (127)
            </div>
            <div 
              className={`tab-header ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Returns
            </div>
          </div>
          
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="tab-content active">
              <div className="description-content">
                {product.description}
              </div>
            </div>
          )}
          
          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div className="tab-content active">
              <table className="specs-table">
                <tbody>
                  <tr>
                    <td>Material</td>
                    <td>{product.material || '100% Cotton'}</td>
                  </tr>
                  <tr>
                    <td>Care Instructions</td>
                    <td>{product.care || 'Machine wash cold'}</td>
                  </tr>
                  <tr>
                    <td>Fit</td>
                    <td>{product.fit || 'Regular Fit'}</td>
                  </tr>
                  <tr>
                    <td>Origin</td>
                    <td>{product.origin || 'Imported'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="tab-content active">
              <div className="review-item">
                <div className="review-header">
                  <span className="review-author">Sarah M.</span>
                  <span className="review-rating">★★★★★</span>
                </div>
                <p>Absolutely love this product! The quality is amazing and it fits perfectly.</p>
              </div>
              <div className="review-item">
                <div className="review-header">
                  <span className="review-author">John D.</span>
                  <span className="review-rating">★★★★☆</span>
                </div>
                <p>Great product, but the sizing runs a bit small. Would recommend ordering one size up.</p>
              </div>
            </div>
          )}
          
          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="tab-content active">
              <p>We offer free standard shipping on all orders over $50. Orders are processed within 1-2 business days and delivered within 3-5 business days.</p>
              <p>Free returns within 30 days of purchase. Items must be in original condition with tags attached.</p>
            </div>
          )}
        </div>
        
        {/* Related Products */}
        <div className="related-products">
          <h2 className="related-title">You Might Also Like</h2>
          <div className="related-grid">
            {mockProducts.women.slice(0, 4).map(relatedProduct => (
              <div key={relatedProduct.id} className="product-card">
                <div className="product-image">
                  <img 
                    src={relatedProduct.image} 
                    alt={relatedProduct.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x400/cccccc/ffffff?text=Image+Not+Found';
                    }}
                  />
                  {relatedProduct.badge && (
                    <div className={`product-badge-small ${relatedProduct.badge.toLowerCase()}`}>
                      {relatedProduct.badge}
                    </div>
                  )}
                </div>
                <div className="product-info-small">
                  <h3 className="product-name-small">{relatedProduct.name}</h3>
                  <div className="product-price-small">
                    <span className="current-price-small">{formatPrice(relatedProduct.price)}</span>
                    {relatedProduct.oldPrice && (
                      <span className="old-price-small">{formatPrice(relatedProduct.oldPrice)}</span>
                    )}
                  </div>
                  <button 
                    className="btn-view-small"
                    onClick={() => navigate(`/product/${relatedProduct.id}`, { 
                      state: { product: relatedProduct } 
                    })}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Chat Modal */}
      {showChatModal && (
        <div className="chat-modal">
          <div className="chat-modal-content">
            <div className="chat-header">
              <h3>Chat about: {product.name}</h3>
              <button className="chat-close" onClick={() => setShowChatModal(false)}>
                &times;
              </button>
            </div>
            <div className="chat-messages">
              {chatMessages.map(message => (
                <div key={message.id} className={`message ${message.type}-message`}>
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">{message.time}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message seller-message">
                  <div className="message-content">
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type your message..."
              />
              <button onClick={sendChatMessage}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Selection Modal */}
      {showSizeModal && (
        <div className="size-selection-modal">
          <div className="size-selection-content">
            <div className="size-selection-header">
              <h3>Select Size</h3>
              <button 
                className="size-selection-close" 
                onClick={handleSizeModalClose}
              >
                &times;
              </button>
            </div>
            <div className="size-selection-body">
              <div className="size-selection-tabs">
                <div className="size-selection-tab active">Standard Sizes</div>
              </div>
              
              <div className="size-selection-tab-content active">
                <h4>Select your size</h4>
                <div className="size-selection-options">
                  {["XS", "S", "M", "L", "XL", "XXL", "Custom", "AI"].map(size => (
                    <div
                      key={size}
                      className={`size-selection-option ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {size === 'AI' ? (
                        <>
                          <i className="fas fa-robot"></i> AI Recommendation
                        </>
                      ) : (
                        size
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Custom Size Inputs */}
                {selectedSize === 'Custom' && (
                  <div className="custom-size-inputs">
                    <h4>Enter your custom measurements</h4>
                    <div className="custom-size-input">
                      <label htmlFor="custom-length">Length (inches)</label>
                      <input 
                        type="number" 
                        id="custom-length" 
                        value={customSize.length}
                        onChange={(e) => handleCustomSizeChange('length', e.target.value)}
                        min="20" 
                        max="40" 
                        placeholder="e.g. 28" 
                      />
                    </div>
                    <div className="custom-size-input">
                      <label htmlFor="custom-width">Width (inches)</label>
                      <input 
                        type="number" 
                        id="custom-width" 
                        value={customSize.width}
                        onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                        min="20" 
                        max="60" 
                        placeholder="e.g. 32" 
                      />
                    </div>
                    <div className="custom-size-input">
                      <label htmlFor="custom-notes">Additional Notes</label>
                      <input 
                        type="text" 
                        id="custom-notes" 
                        value={customSize.notes}
                        onChange={(e) => handleCustomSizeChange('notes', e.target.value)}
                        placeholder="Any special requirements" 
                      />
                    </div>
                    {(!customSize.length || !customSize.width) && (
                      <div className="error-message">
                        Please enter both length and width measurements.
                      </div>
                    )}
                  </div>
                )}
                
                {/* AI Recommendation Section */}
                {selectedSize === 'AI' && (
                  <div className="size-recommendation-inputs">
                    <h4>Get AI Size Recommendation</h4>
                    <div className="size-recommendation-input">
                      <label htmlFor="recommendation-age">Age *</label>
                      <input 
                        type="number" 
                        id="recommendation-age" 
                        value={aiRecommendation.age}
                        onChange={(e) => handleAiRecommendationChange('age', e.target.value)}
                        min="1" 
                        max="120" 
                        placeholder="e.g. 25" 
                      />
                    </div>
                    <div className="size-recommendation-input">
                      <label htmlFor="recommendation-gender">Gender *</label>
                      <select 
                        id="recommendation-gender" 
                        value={aiRecommendation.gender}
                        onChange={(e) => handleAiRecommendationChange('gender', e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="size-recommendation-input">
                      <label htmlFor="recommendation-height">Height (cm) *</label>
                      <input 
                        type="number" 
                        id="recommendation-height" 
                        value={aiRecommendation.height}
                        onChange={(e) => handleAiRecommendationChange('height', e.target.value)}
                        min="50" 
                        max="250" 
                        placeholder="e.g. 175" 
                      />
                    </div>
                    <div className="size-recommendation-input">
                      <label htmlFor="recommendation-weight">Weight (kg) *</label>
                      <input 
                        type="number" 
                        id="recommendation-weight" 
                        value={aiRecommendation.weight}
                        onChange={(e) => handleAiRecommendationChange('weight', e.target.value)}
                        min="10" 
                        max="300" 
                        placeholder="e.g. 70" 
                      />
                    </div>
                    <button className="btn-primary" onClick={getAIRecommendation}>
                      <i className="fas fa-robot"></i> Get AI Recommendation
                    </button>
                    
                    {showAiResult && (
                      <div className="ai-recommendation-result">
                        <h4>AI Size Recommendation</h4>
                        <p>{aiResult}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="size-selection-footer">
              <button 
                className="btn-secondary" 
                onClick={handleSizeModalClose}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmSizeSelection}
                disabled={
                  !selectedSize || 
                  (selectedSize === 'Custom' && (!customSize.length || !customSize.width)) ||
                  (selectedSize === 'AI' && !showAiResult)
                }
              >
                {actionType === 'buyNow' ? 'Buy Now' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button className="chat-float-btn" onClick={openChat}>
        <i className="fas fa-comments"></i>
      </button>
    </div>
  );
}

export default ProductDetail;