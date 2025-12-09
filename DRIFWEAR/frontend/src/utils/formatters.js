// Format price with currency
export const formatPrice = (price, currency = 'USD', locale = 'en-US') => {
  if (price === null || price === undefined || isNaN(price)) {
    return '$0.00';
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(numericPrice);
};

// Format date
export const formatDate = (dateString, locale = 'en-US') => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date Error';
  }
};

// Format phone number
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.toString().replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not standard length
  return phoneNumber;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

// Format order status
export const formatOrderStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'pending_payment': 'Pending Payment',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'completed': 'Completed',
    'paid': 'Paid'
  };
  
  return statusMap[status] || status;
};

// Format payment method
export const formatPaymentMethod = (method) => {
  const methodMap = {
    'cod': 'Cash on Delivery',
    'gcash': 'GCash',
    'paymaya': 'PayMaya',
    'card': 'Credit/Debit Card',
    'paymongo_online': 'Online Payment',
    'paymongo_gcash': 'GCash',
    'paymongo_paymaya': 'PayMaya',
    'paymongo_card': 'Credit/Debit Card'
  };
  
  return methodMap[method] || method;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return '??';
  
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  
  return initials;
};