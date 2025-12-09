import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Make sure to create this CSS file

function Navbar({ openAuthModal, currentUser, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser);
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [currentUser]);

  const loadUserData = (userData) => {
    if (userData) {
      try {
        const userCart = localStorage.getItem(`driftwear_cart_${userData.id}`);
        const userWishlist = localStorage.getItem(`driftwear_wishlist_${userData.id}`);
        
        const cart = userCart ? JSON.parse(userCart) : [];
        const wishlist = userWishlist ? JSON.parse(userWishlist) : [];
        
        setCartCount(cart.reduce((total, item) => total + (item.quantity || 0), 0));
        setWishlistCount(wishlist.length);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  };

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = () => {
    if (currentUser) {
      navigate('/profile');
    } else if (openAuthModal) {
      openAuthModal('login');
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <span className="top-bar-text">FREE SHIPPING ON ALL ORDERS OVER $50</span>
        </div>
      </div>

      {/* Header */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            {/* Left Section - Navigation & Mobile Menu */}
            <div className="header-left">
              {/* Desktop Navigation */}
              <nav className="desktop-nav">
                <Link to="/products" className="nav-link">Shop</Link>
                <Link to="/customization" className="nav-link">Customize</Link>
                <Link to="/contact" className="nav-link">Contact</Link>
              </nav>

              {/* Mobile Menu Button */}
              <button 
                className="mobile-menu-btn"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
              </button>
            </div>

            {/* Center - Logo */}
            <div className="logo">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                DRIFTWEAR
              </Link>
            </div>

            {/* Right Section - User Actions */}
            <div className="header-right">
              {/* Desktop User Actions */}
              <div className="desktop-actions">
                {/* Search Button */}
                <button className="action-btn search-btn" aria-label="Search">
                  <i className="fas fa-search"></i>
                </button>

                {/* Wishlist */}
                <button 
                  className="action-btn wishlist-btn" 
                  onClick={() => handleNavigation('/wishlist')}
                  aria-label="Wishlist"
                >
                  <i className="fas fa-heart"></i>
                  {wishlistCount > 0 && (
                    <span className="badge">{wishlistCount}</span>
                  )}
                </button>

                {/* Cart */}
                <button 
                  className="action-btn cart-btn" 
                  onClick={() => handleNavigation('/cart')}
                  aria-label="Cart"
                >
                  <i className="fas fa-shopping-bag"></i>
                  {cartCount > 0 && (
                    <span className="badge">{cartCount}</span>
                  )}
                </button>

                {/* Profile/Auth */}
                {currentUser ? (
                  <div className="user-menu">
                    <button 
                      className="action-btn profile-btn" 
                      onClick={() => handleNavigation('/profile')}
                      aria-label="Profile"
                    >
                      <i className="fas fa-user"></i>
                    </button>
                    <div className="user-dropdown">
                      <span className="user-greeting">Hello, {currentUser.name || currentUser.email}</span>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="auth-btn" 
                    onClick={handleAuthClick}
                  >
                    <i className="fas fa-user"></i>
                    <span className="auth-text">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <div className="mobile-nav-content">
              {/* User Info Section */}
              <div className="mobile-user-section">
                {currentUser ? (
                  <>
                    <div className="mobile-user-info">
                      <i className="fas fa-user"></i>
                      <span>Hello, {currentUser.name || currentUser.email}</span>
                    </div>
                    <button className="mobile-nav-btn" onClick={() => handleNavigation('/profile')}>
                      My Profile
                    </button>
                  </>
                ) : (
                  <button className="mobile-auth-btn" onClick={handleAuthClick}>
                    <i className="fas fa-user"></i>
                    Sign In / Register
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="mobile-nav-links">
                <button 
                  className="mobile-nav-link"
                  onClick={() => handleNavigation('/')}
                >
                  Home
                </button>
                <button 
                  className="mobile-nav-link"
                  onClick={() => handleNavigation('/products')}
                >
                  Shop All
                </button>
                <button 
                  className="mobile-nav-link"
                  onClick={() => handleNavigation('/customization')}
                >
                  Customization
                </button>
                <button 
                  className="mobile-nav-link"
                  onClick={() => handleNavigation('/contact')}
                >
                  Contact Us
                </button>
              </nav>

              {/* Quick Actions */}
              <div className="mobile-actions">
                <button 
                  className="mobile-action-btn"
                  onClick={() => handleNavigation('/wishlist')}
                >
                  <i className="fas fa-heart"></i>
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </button>
                <button 
                  className="mobile-action-btn"
                  onClick={() => handleNavigation('/cart')}
                >
                  <i className="fas fa-shopping-bag"></i>
                  Cart {cartCount > 0 && `(${cartCount})`}
                </button>
              </div>

              {/* Logout for logged-in users */}
              {currentUser && (
                <div className="mobile-logout-section">
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="mobile-nav-overlay" 
              onClick={toggleMobileMenu}
            ></div>
          )}
        </div>
      </header>
    </>
  );
}

export default Navbar;