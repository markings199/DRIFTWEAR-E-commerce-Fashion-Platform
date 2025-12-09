class ProductDetailManager {
    constructor() {
        this.product = null;
        this.relatedProducts = [];
        this.init();
    }

    async init() {
        await this.loadProduct();
        await this.loadRelatedProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add to cart button
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // Quantity buttons
        const quantityMinus = document.getElementById('quantity-minus');
        const quantityPlus = document.getElementById('quantity-plus');
        const quantityInput = document.getElementById('quantity-input');

        if (quantityMinus && quantityPlus && quantityInput) {
            quantityMinus.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });

            quantityPlus.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                quantityInput.value = value + 1;
            });

            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                if (isNaN(value) || value < 1) {
                    quantityInput.value = 1;
                }
            });
        }
    }

    async loadProduct() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            if (!productId) {
                window.location.href = '/products.html';
                return;
            }

            const productContainer = document.getElementById('product-detail-container');
            if (productContainer) {
                productContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            }

            const response = await fetch(`${API_BASE}/products/${productId}`);
            
            if (response.ok) {
                this.product = await response.json();
                this.renderProduct();
            } else {
                throw new Error('Failed to fetch product');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError();
        }
    }

    renderProduct() {
        const productContainer = document.getElementById('product-detail-container');
        if (!productContainer || !this.product) return;

        const discount = this.product.onSale ? 
            `<span class="discount">${this.product.discountPercentage}% OFF</span>` : '';
        
        const oldPrice = this.product.onSale ? 
            `<span class="old-price">${formatPrice(this.product.price)}</span>` : '';
        
        const salePrice = this.product.onSale ? 
            this.product.price * (1 - this.product.discountPercentage / 100) : this.product.price;

        // Generate size options
        let sizeOptions = '';
        if (this.product.sizes && this.product.sizes.length > 0) {
            sizeOptions = this.product.sizes.map(size => 
                `<option value="${size}">${size}</option>`
            ).join('');
        }

        // Generate color options
        let colorOptions = '';
        if (this.product.colors && this.product.colors.length > 0) {
            colorOptions = this.product.colors.map(color => 
                `<option value="${color}">${color}</option>`
            ).join('');
        }

        productContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <!-- Product Images -->
                <div>
                    <div style="border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                        <img src="${this.product.images && this.product.images[0] ? this.product.images[0] : 'https://via.placeholder.com/500'}" 
                             alt="${this.product.name}" style="width: 100%; height: auto;">
                    </div>
                    ${this.product.images && this.product.images.length > 1 ? `
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                            ${this.product.images.map((image, index) => `
                                <img src="${image}" alt="${this.product.name} ${index + 1}" 
                                     style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; cursor: pointer;">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Product Info -->
                <div>
                    <h1 style="font-size: 32px; margin-bottom: 15px;">${this.product.name}</h1>
                    <div class="product-price" style="margin-bottom: 20px;">
                        <span class="current-price" style="font-size: 24px;">${formatPrice(salePrice)}</span>
                        ${oldPrice}
                        ${discount}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <p>${this.product.description}</p>
                    </div>
                    
                    ${this.product.stock > 0 ? `
                        <div style="color: #27ae60; margin-bottom: 20px;">
                            <i class="fas fa-check"></i> In Stock
                        </div>
                    ` : `
                        <div style="color: #e74c3c; margin-bottom: 20px;">
                            <i class="fas fa-times"></i> Out of Stock
                        </div>
                    `}
                    
                    ${sizeOptions ? `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="size-select">Size</label>
                            <select id="size-select" class="form-control">
                                <option value="">Select Size</option>
                                ${sizeOptions}
                            </select>
                        </div>
                    ` : ''}
                    
                    ${colorOptions ? `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="color-select">Color</label>
                            <select id="color-select" class="form-control">
                                <option value="">Select Color</option>
                                ${colorOptions}
                            </select>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <label for="quantity-input">Quantity:</label>
                        <div class="quantity-control">
                            <button class="quantity-btn" id="quantity-minus">-</button>
                            <input type="number" id="quantity-input" class="quantity-input" value="1" min="1" max="${this.product.stock}">
                            <button class="quantity-btn" id="quantity-plus">+</button>
                        </div>
                    </div>
                    
                    <button id="add-to-cart-btn" class="btn" style="width: 100%;" ${this.product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;

        // Reattach event listeners
        this.setupEventListeners();
    }

    async loadRelatedProducts() {
        try {
            const response = await fetch(`${API_BASE}/products?category=${this.product.category}&limit=4`);
            
            if (response.ok) {
                const data = await response.json();
                this.relatedProducts = data.products.filter(p => p._id !== this.product._id);
                this.renderRelatedProducts();
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    renderRelatedProducts() {
        const relatedContainer = document.getElementById('related-products');
        if (!relatedContainer || this.relatedProducts.length === 0) return;

        let productsHTML = '';
        
        this.relatedProducts.forEach(product => {
            const discount = product.onSale ? 
                `<span class="discount">${product.discountPercentage}% OFF</span>` : '';
            
            const oldPrice = product.onSale ? 
                `<span class="old-price">${formatPrice(product.price)}</span>` : '';
            
            const salePrice = product.onSale ? 
                product.price * (1 - product.discountPercentage / 100) : product.price;

            productsHTML += `
                <div class="product-card" data-id="${product._id}">
                    <div class="product-image">
                        ${product.onSale ? '<span class="product-badge">SALE</span>' : ''}
                        <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300'}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">
                            <span class="current-price">${formatPrice(salePrice)}</span>
                            ${oldPrice}
                            ${discount}
                        </div>
                        <div class="product-actions">
                            <button class="btn-cart" onclick="cartManager.addToCart('${product._id}', 1)">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="btn-view" onclick="window.location.href='/product-detail.html?id=${product._id}'">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        relatedContainer.innerHTML = productsHTML;
    }

    async addToCart() {
        if (!this.product || this.product.stock === 0) return;

        const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
        const size = document.getElementById('size-select') ? document.getElementById('size-select').value : '';
        const color = document.getElementById('color-select') ? document.getElementById('color-select').value : '';

        const success = await cartManager.addToCart(this.product._id, quantity, size, color);
        
        if (success) {
            window.driftwearApp.showNotification('Product added to cart!');
        }
    }

    showError() {
        const productContainer = document.getElementById('product-detail-container');
        if (productContainer) {
            productContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load product. Please try again.</p>
                    <a href="/products.html" class="btn">Back to Products</a>
                </div>
            `;
        }
    }
}

// Initialize product detail manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-detail-container')) {
        window.productDetailManager = new ProductDetailManager();
    }
});