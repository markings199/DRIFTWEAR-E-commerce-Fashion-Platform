// services/wishlist.service.js
import { authService } from './authService';

export const wishlistService = {
  getWishlist() {
    const user = authService.getCurrentUser();
    if (!user) return [];
    
    const userWishlist = localStorage.getItem(`driftwear_wishlist_${user.id}`);
    return userWishlist ? JSON.parse(userWishlist) : [];
  },

  addToWishlist(product) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');

    const wishlist = this.getWishlist();
    const existingItem = wishlist.find(item => item.id === product.id);

    if (!existingItem) {
      wishlist.push(product);
      localStorage.setItem(`driftwear_wishlist_${user.id}`, JSON.stringify(wishlist));
    }

    return wishlist;
  },

  removeFromWishlist(productId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');

    const wishlist = this.getWishlist();
    const filteredWishlist = wishlist.filter(item => item.id !== productId);

    localStorage.setItem(`driftwear_wishlist_${user.id}`, JSON.stringify(filteredWishlist));
    return filteredWishlist;
  },

  isInWishlist(productId) {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item.id === productId);
  },

  getWishlistCount() {
    const wishlist = this.getWishlist();
    return wishlist.length;
  }
};