class CheckoutManager {
    constructor() {
        this.cart = null;
        this.init();
    }

    async init() {
        await this.loadCart();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Place order button
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }
    }

    async loadCart() {
        try {
            const response = await fetch(`${API_BASE}/cart`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.cart = await response.json();
                this.renderOrderSummary();
            } else if (response.status === 401) {
                this.showAuthRequired();
            } else {
                throw new Error('Failed to load cart');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.showError();
        }
    }

    renderOrderSummary() {
        const orderSummary = document.getElementById('order-summary');
        const orderTotal = document.getElementById('order-total');
        
        if (!orderSummary || !orderTotal || !this.cart || this.cart.items.length === 0) {
            window.location.href = '/cart.html';
            return;
        }

        let summaryHTML = '';
        this.cart.items.forEach(item => {
            summaryHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>${item.product.name} × ${item.quantity}</div>
                    <div>${formatPrice(item.product.price * item.quantity)}</div>
                </div>
            `;
        });

        orderSummary.innerHTML = summaryHTML;

        // Calculate totals
        const subtotal = this.cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
        const shipping = subtotal > 0 ? 10 : 0; // $10 shipping
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        orderTotal.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>Subtotal:</div>
                <div>${formatPrice(subtotal)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>Shipping:</div>
                <div>${formatPrice(shipping)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>Tax:</div>
                <div>${formatPrice(tax)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px;">
                <div>Total:</div>
                <div>${formatPrice(total)}</div>
            </div>
        `;
    }

    async placeOrder() {
        const shippingForm = document.getElementById('shipping-form');
        const paymentForm = document.getElementById('payment-form');
        
        if (!shippingForm.checkValidity() || !paymentForm.checkValidity()) {
            window.driftwearApp.showNotification('Please fill all required fields', 'error');
            return;
        }

        const shippingData = new FormData(shippingForm);
        const paymentData = new FormData(paymentForm);

        const orderData = {
            shippingAddress: {
                fullName: shippingData.get('fullName'),
                address: shippingData.get('address'),
                city: shippingData.get('city'),
                state: shippingData.get('state'),
                zipCode: shippingData.get('zipCode'),
                country: shippingData.get('country'),
                phone: shippingData.get('phone')
            },
            paymentMethod: 'card' // For simplicity, we're using card as the only payment method
        };

        const placeOrderBtn = document.getElementById('place-order-btn');
        const originalText = placeOrderBtn.textContent;
        
        try {
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Processing...';

            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                window.driftwearApp.showNotification('Order placed successfully!');
                setTimeout(() => {
                    window.location.href = '/orders.html';
                }, 1500);
            } else {
                window.driftwearApp.showNotification(result.error || 'Failed to place order', 'error');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            window.driftwearApp.showNotification('An error occurred while placing your order', 'error');
        } finally {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = originalText;
        }
    }

    showAuthRequired() {
        window.driftwearApp.showNotification('Please login to checkout', 'error');
        setTimeout(() => {
            window.location.href = '/signup.html';
        }, 1500);
    }

    showError() {
        window.driftwearApp.showNotification('Failed to load cart', 'error');
        setTimeout(() => {
            window.location.href = '/cart.html';
        }, 1500);
    }
}

// Initialize checkout manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('place-order-btn')) {
        window.checkoutManager = new CheckoutManager();
    }
});