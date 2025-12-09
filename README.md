# DRIFTWEAR - Premium E-commerce Fashion Platform

A comprehensive full-stack e-commerce website built with modern web technologies, featuring product customization, secure payment processing, and complete admin management system.

## 🌟 Features

### 🛍️ Customer Features
- **Product Catalog**: Browse men's, women's, and kids' clothing with advanced filtering
- **Product Customization**: Interactive design tool using Fabric.js for personalized apparel
- **User Authentication**: Secure login/signup with local storage
- **Shopping Cart & Wishlist**: Persistent cart and wishlist functionality
- **Secure Checkout**: Multiple payment options including PayMongo integration
- **Order Tracking**: Real-time order status updates and history
- **User Profile**: Account management and order history

### 💳 Payment Integration
- **PayMongo Integration**: Support for GCash, PayMaya, and credit/debit cards
- **Cash on Delivery**: Traditional payment option
- **Webhook Handling**: Automatic payment status updates
- **Demo Mode**: Testing environment for development

### 👨‍💼 Admin Dashboard
- **Order Management**: View and update order statuses
- **Product Management**: Add, edit, and manage product inventory
- **User Management**: Monitor and manage customer accounts
- **Custom Designs**: Review and approve user-created designs
- **Message Center**: Handle customer inquiries and support tickets
- **Analytics**: Order statistics and business insights

### 🎨 Design & Customization
- **Interactive Canvas**: Fabric.js-powered design interface
- **Template Library**: Pre-designed graphics and patterns
- **Real-time Preview**: Live preview of custom designs
- **Multi-format Support**: Support for various apparel types (t-shirts, pants, sneakers)

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **React Router** - Declarative routing for React applications
- **Vite** - Fast build tool and development server
- **Fabric.js** - Powerful canvas library for product customization
- **CSS3** - Modern styling with responsive design

### Backend
- **Node.js** - JavaScript runtime for server-side development
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database for flexible data storage
- **JWT Authentication** - Secure token-based authentication
- **PayMongo API** - Philippine payment gateway integration

### Key Dependencies
- **Frontend**: React, React Router, Fabric.js
- **Backend**: Express, MongoDB, PayMongo SDK
- **Development**: Vite, ESLint, various utility libraries

## 📁 Project Structure

```
driftwear/
├── backend/                    # Node.js/Express server
│   ├── controllers/           # Business logic controllers
│   ├── models/                # MongoDB data models
│   ├── routes/                # API route definitions
│   ├── middleware/            # Custom middleware functions
│   ├── config/                # Database and app configuration
│   └── server.js              # Main server file
├── frontend/                  # React application
│   ├── public/                # Static assets
│   │   ├── images/           # Product images
│   │   ├── graphics/         # Design templates
│   │   └── customization/    # 3D model assets
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── css/              # Stylesheets
│   │   ├── services/         # API service functions
│   │   ├── utils/            # Utility functions
│   │   └── App.jsx           # Main app component
│   └── package.json
├── README.md                  # Project documentation
└── TODO.md                    # Development tasks
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- PayMongo account (for payment processing)

### Backend Setup
```bash
cd backend
npm install
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and PayMongo keys
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create appropriate `.env` files in the backend directory:

#### For Development (`.env.development`):
```env
# Database
MONGO_URI=mongodb://localhost:27017/driftwear

# PayMongo Configuration
PAYMONGO_API_KEY=sk_test_your_secret_key_here

# JWT
JWT_SECRET=your_jwt_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:5173

# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
```

#### For Production (`.env.production`):
```env
# Database
MONGO_URI=your_production_mongodb_uri_here

# PayMongo Configuration
PAYMONGO_API_KEY=sk_live_your_live_secret_key_here

# JWT
JWT_SECRET=your_production_jwt_secret_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com

# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin authentication

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/user/:userId` - Get user orders
- `PUT /api/orders/:id/status` - Update order status (admin)

### Payments
- `POST /api/payment/create-checkout-session` - Create PayMongo session
- `POST /api/payment/verify-payment` - Verify payment status

### Customization
- `POST /api/designs` - Save custom design
- `GET /api/designs` - Get user designs

## 🎨 Customization Features

The platform includes a sophisticated product customization system:
- **Canvas Interface**: Drag-and-drop design elements
- **Text Tools**: Add custom text with font selection
- **Image Upload**: Upload personal images and graphics
- **Template Library**: Pre-made designs and patterns
- **Real-time Preview**: Instant visual feedback
- **Multi-product Support**: Customize t-shirts, pants, and sneakers

## 💳 Payment Processing

Integrated with PayMongo for Philippine payments:
- **GCash**: Mobile wallet payments
- **PayMaya**: Digital wallet integration
- **Credit/Debit Cards**: International card support
- **COD**: Cash on delivery option
- **Webhook Integration**: Automatic status updates

## 👥 User Roles

### Customer
- Browse and purchase products
- Customize apparel designs
- Manage orders and profile
- Contact support

### Administrator
- Manage products and inventory
- Process and update orders
- Handle customer support
- Review custom designs
- Access analytics

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Touch interfaces

## 🔒 Security Features

- JWT token-based authentication
- Password hashing and validation
- Secure payment processing
- Input sanitization
- CORS protection
- Environment variable management

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Use PM2 or similar for production process management
```

## 🧪 Testing

### Payment Testing
- Use PayMongo sandbox environment
- Test cards and GCash accounts provided by PayMongo
- Verify webhook functionality

### Demo Mode
- Built-in demo payment option for development
- Simulates successful transactions
- Useful for testing order flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## 🙏 Acknowledgments

- PayMongo for payment processing
- Fabric.js for canvas functionality
- React community for excellent documentation
- Open source contributors

---

**Elevate your style with DRIFTWEAR! 🎉**
