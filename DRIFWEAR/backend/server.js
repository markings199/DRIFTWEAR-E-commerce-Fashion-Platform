// ============================================
// DRIFTWEAR BACKEND SERVER
// ============================================

// 1. LOAD ENVIRONMENT VARIABLES (CRITICAL - DO THIS FIRST!)
console.log('🔧 ===== LOADING ENVIRONMENT =====');
console.log('   Current NODE_ENV:', process.env.NODE_ENV || 'not set');

// Load appropriate .env file
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
  console.log('   Loading: .env.production');
} else {
  require('dotenv').config({ path: '.env.development' });
  console.log('   Loading: .env.development');
}

// 2. CORE DEPENDENCIES
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// 3. CREATE EXPRESS APP
const app = express();

// Store start time for diagnostics
app.set('startTime', new Date().toISOString());

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS Configuration - Parse comma-separated origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

console.log('🌐 CORS Allowed Origins:', allowedOrigins);

// More permissive CORS for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ CORS allowing (dev): ${origin || 'No Origin'}`);
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowing: ${origin}`);
      return callback(null, true);
    }
    
    console.log('❌ CORS Blocked Origin:', origin);
    const msg = `The CORS policy for this site does not allow access from ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Handle preflight requests
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

// RAW BODY LOGGER - for debugging payment webhooks
app.use((req, res, next) => {
  if (req.path.includes('/payment/webhook')) {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      console.log('📨 Raw webhook body received:', rawBody.substring(0, 500));
      next();
    });
  } else {
    next();
  }
});

// Body parsers
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf.toString();
    
    // Log payment requests for debugging
    if (req.path.includes('/payment/create-checkout-session')) {
      console.log('💰 Payment request raw body:', req.rawBody);
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logging middleware (replaces morgan)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 ${req.method} ${req.originalUrl} - ${timestamp}`);
  console.log(`   Origin: ${req.headers.origin || 'No Origin'}`);
  console.log(`   Content-Type: ${req.headers['content-type'] || 'Not Set'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);
  
  // For POST requests, log body summary
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    const bodySummary = {};
    for (const key in req.body) {
      if (key === 'items' && Array.isArray(req.body.items)) {
        bodySummary.items = `Array(${req.body.items.length})`;
      } else if (key === 'customerInfo') {
        bodySummary.customerInfo = req.body.customerInfo ? 'Present' : 'Missing';
      } else if (typeof req.body[key] === 'object') {
        bodySummary[key] = 'Object';
      } else if (typeof req.body[key] === 'string' && req.body[key].length > 50) {
        bodySummary[key] = `${req.body[key].substring(0, 50)}...`;
      } else {
        bodySummary[key] = req.body[key];
      }
    }
    console.log(`   Body Summary:`, JSON.stringify(bodySummary, null, 2));
  }
  
  next();
});

// Response logging middleware
app.use((req, res, next) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];
  
  res.write = function (...args) {
    chunks.push(Buffer.from(args[0]));
    oldWrite.apply(res, args);
  };
  
  res.end = function (...args) {
    if (args[0]) {
      chunks.push(Buffer.from(args[0]));
    }
    const body = Buffer.concat(chunks).toString('utf8');
    
    // Log payment responses
    if (req.path.includes('/payment') && (req.method === 'POST' || req.method === 'GET')) {
      console.log(`📤 Response for ${req.method} ${req.path}:`);
      try {
        const jsonBody = JSON.parse(body);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Success: ${jsonBody.success || false}`);
        console.log(`   Message: ${jsonBody.message || 'No message'}`);
        if (jsonBody.checkoutUrl) {
          console.log(`   Checkout URL: ${jsonBody.checkoutUrl.substring(0, 80)}...`);
        }
      } catch (e) {
        console.log(`   Raw response: ${body.substring(0, 200)}`);
      }
    }
    
    oldEnd.apply(res, args);
  };
  
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    // Sanitize the URI for logging (hide password)
    const sanitizedUri = process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log('   URI:', sanitizedUri);
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// ============================================
// ROUTE IMPORTS
// ============================================

// Health check endpoint - ENHANCED
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    serverStartTime: app.get('startTime'),
    endpoints: {
      health: 'GET /health',
      payment: {
        test: 'GET /api/payment/test',
        quickTest: 'GET /api/payment/quick-test',
        createCheckout: 'POST /api/payment/create-checkout-session',
        testCreate: 'POST /api/payment/test-create-session',
        echo: 'POST /api/payment/echo',
        diagnostics: 'GET /api/payment/diagnostics'
      }
    }
  });
});

// API Routes
const apiRoutes = express.Router();

// ============ PAYMENT ROUTES ============
try {
  const paymentRoutes = require('./routes/paymentRoutes');
  apiRoutes.use('/payment', paymentRoutes);
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.error('❌ Payment routes error:', error.message);
  console.error('   Stack:', error.stack);
  
  // Create enhanced demo payment routes
  apiRoutes.get('/payment/quick-test', (req, res) => {
    res.json({
      success: true,
      message: '✅ Demo Payment API is working!',
      serverTime: new Date().toISOString()
    });
  });
  
  apiRoutes.get('/payment/test', (req, res) => {
    res.json({
      success: true,
      message: 'Demo PayMongo payment API is working',
      timestamp: new Date().toISOString(),
      endpoints: {
        quickTest: 'GET /api/payment/quick-test',
        createCheckout: 'POST /api/payment/create-checkout-session',
        testCreate: 'POST /api/payment/test-create-session',
        echo: 'POST /api/payment/echo'
      }
    });
  });
  
  apiRoutes.post('/payment/echo', (req, res) => {
    console.log('🔄 Echo endpoint hit - Body:', req.body);
    res.json({
      success: true,
      message: 'Echo response',
      receivedAt: new Date().toISOString(),
      yourData: req.body,
      rawBody: req.rawBody
    });
  });
  
  apiRoutes.post('/payment/test-create-session', (req, res) => {
    console.log('🧪 Test create session hit - Body:', req.body);
    
    const sampleData = {
      orderId: `TEST-${Date.now()}`,
      totalAmount: 79.99,
      items: [
        {
          name: 'Hooded Jacket',
          price: 79.99,
          quantity: 1,
          size: 'M',
          color: 'Blue'
        }
      ],
      customerInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      }
    };
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.status(200).json({
      success: true,
      message: 'Test checkout session created',
      checkoutUrl: `${frontendUrl}/order-confirmation?success=true&order_id=${sampleData.orderId}&demo=true`,
      sessionId: `demo_session_${Date.now()}`,
      demo: true,
      orderId: sampleData.orderId,
      amount: sampleData.totalAmount
    });
  });
  
  apiRoutes.post('/payment/create-checkout-session', (req, res) => {
    console.log('💰 Demo checkout endpoint hit');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Validation
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty request body',
        help: 'Send JSON with items, totalAmount, and orderId'
      });
    }
    
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items provided for checkout',
        received: req.body,
        help: 'Items must be a non-empty array'
      });
    }
    
    if (!req.body.totalAmount || req.body.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total amount',
        received: req.body.totalAmount
      });
    }
    
    if (!req.body.orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
        help: 'Include an orderId in your request'
      });
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const orderId = req.body.orderId;
    
    res.status(200).json({
      success: true,
      message: 'Demo checkout session created',
      checkoutUrl: `${frontendUrl}/order-confirmation?success=true&order_id=${orderId}&demo=true`,
      sessionId: `demo_session_${Date.now()}`,
      demo: true,
      orderId: orderId,
      amount: req.body.totalAmount,
      itemsCount: req.body.items.length
    });
  });
  
  apiRoutes.get('/payment/diagnostics', (req, res) => {
    const diagnostics = {
      server: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        frontendUrl: process.env.FRONTEND_URL
      },
      paymongo: {
        apiKeyPresent: !!process.env.PAYMONGO_API_KEY,
        apiKeyPrefix: process.env.PAYMONGO_API_KEY ? 
                     process.env.PAYMONGO_API_KEY.substring(0, 10) + '...' : 'none'
      },
      demoMode: true,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      diagnostics: diagnostics
    });
  });
}

// ============ PRODUCT ROUTES ============
try {
  const productRoutes = require('./routes/productRoutes');
  apiRoutes.use('/products', productRoutes);
  console.log('✅ Product routes loaded');
} catch (error) {
  console.log('⚠️ Product routes not found, using placeholder');
  apiRoutes.get('/products', (req, res) => {
    res.json({
      success: true,
      message: 'Product routes not implemented',
      products: []
    });
  });
}

// ============ ORDER ROUTES ============
try {
  const orderRoutes = require('./routes/orderRoutes');
  apiRoutes.use('/orders', orderRoutes);
  console.log('✅ Order routes loaded');
} catch (error) {
  console.log('⚠️ Order routes not found, using placeholder');
  apiRoutes.get('/orders', (req, res) => {
    res.json({
      success: true,
      message: 'Order routes not implemented',
      orders: []
    });
  });
}

// ============ USER ROUTES ============
try {
  const userRoutes = require('./routes/userRoutes');
  apiRoutes.use('/users', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.log('⚠️ User routes not found, using placeholder');
  apiRoutes.post('/users/register', (req, res) => {
    res.json({
      success: true,
      message: 'User registration would be here',
      user: {
        id: 'demo_user',
        name: req.body.name || 'Demo User',
        email: req.body.email || 'demo@example.com'
      }
    });
  });
}

// ============ ADDITIONAL DEBUG ROUTES ============
apiRoutes.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint',
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        origin: req.headers.origin,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent']
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      corsOrigin: process.env.CORS_ORIGIN
    },
    server: {
      startTime: app.get('startTime'),
      uptime: process.uptime()
    }
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// ============================================
// PAYMONGO WEBHOOK ENDPOINT
// ============================================

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('📨 ===== PAYMONGO WEBHOOK RECEIVED =====');
    const payload = JSON.parse(req.body.toString());
    
    console.log('   Event Type:', payload?.data?.type || 'Unknown');
    console.log('   Event ID:', payload?.data?.id || 'Unknown');
    console.log('   Time:', new Date().toISOString());
    
    // Process webhook events
    const event = payload.data;
    switch (event.type) {
      case 'payment.paid':
        console.log('✅ Payment paid via webhook');
        console.log('   Amount:', event.attributes?.amount ? event.attributes.amount / 100 : 'N/A');
        console.log('   Order ID:', event.attributes?.metadata?.orderId || 'N/A');
        break;
      case 'checkout_session.payment.paid':
        console.log('✅ Checkout session paid via webhook');
        console.log('   Session ID:', event.attributes?.id || 'N/A');
        break;
      case 'payment.failed':
        console.log('❌ Payment failed via webhook');
        console.log('   Reason:', event.attributes?.failure_message || 'Unknown');
        break;
      default:
        console.log(`📝 Unhandled webhook type: ${event.type}`);
    }
    
    res.status(200).json({ 
      success: true, 
      received: true,
      eventType: event.type
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
});

// ============================================
// STATIC FILES AND SPA FALLBACK
// ============================================

// Serve static files from public directory if it exists
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')));
  console.log('📁 Serving static files from /public');
}

// Simple test endpoint at root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Driftwear Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      root: 'GET /',
      health: 'GET /health',
      api: 'GET /api/debug',
      payment: {
        test: 'GET /api/payment/test',
        quickTest: 'GET /api/payment/quick-test',
        createCheckout: 'POST /api/payment/create-checkout-session',
        testCreate: 'POST /api/payment/test-create-session',
        echo: 'POST /api/payment/echo'
      }
    },
    quickTest: 'Visit /api/payment/quick-test to test payment API'
  });
});

// Single Page Application fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path,
      availableEndpoints: {
        root: 'GET /',
        health: 'GET /health',
        debug: 'GET /api/debug',
        paymentTest: 'GET /api/payment/test',
        paymentQuickTest: 'GET /api/payment/quick-test',
        createCheckout: 'POST /api/payment/create-checkout-session'
      }
    });
  }
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'This is the Driftwear API server',
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /health',
      apiDebug: 'GET /api/debug'
    }
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err.message);
  console.error('   Stack:', err.stack);
  
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Get port from environment or use default
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 STARTING DRIFTWEAR BACKEND SERVER');
    console.log('='.repeat(60));
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 PayMongo API Key: ${process.env.PAYMONGO_API_KEY ? 'Set' : 'Not Set'}`);
    if (process.env.PAYMONGO_API_KEY) {
      console.log(`   Key Prefix: ${process.env.PAYMONGO_API_KEY.substring(0, 10)}...`);
    }
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not Set'}`);
    console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      const address = server.address();
      console.log(`\n✅ SERVER STARTED SUCCESSFULLY!`);
      console.log(`📡 Server URL: http://${HOST}:${PORT}`);
      console.log(`🌐 External URL: http://localhost:${PORT}`);
      console.log('='.repeat(60));
      
      console.log('\n📋 QUICK TEST ENDPOINTS:');
      console.log(`   🌐 http://localhost:${PORT}/`);
      console.log(`   🩺 http://localhost:${PORT}/health`);
      console.log(`   🧪 http://localhost:${PORT}/api/payment/quick-test`);
      console.log(`   🔍 http://localhost:${PORT}/api/debug`);
      console.log('='.repeat(60));
      
      console.log('\n💰 PAYMENT API ENDPOINTS:');
      console.log(`   GET  /api/payment/test - Test payment API`);
      console.log(`   GET  /api/payment/quick-test - Quick test`);
      console.log(`   GET  /api/payment/diagnostics - Diagnostics`);
      console.log(`   POST /api/payment/echo - Echo test (debug)`);
      console.log(`   POST /api/payment/test-create-session - Test checkout`);
      console.log(`   POST /api/payment/create-checkout-session - Real checkout`);
      console.log(`   POST /api/payment/verify-payment - Verify payment`);
      console.log(`   POST /api/payment/webhook - PayMongo webhook`);
      console.log('='.repeat(60));
      
      console.log('\n💡 TROUBLESHOOTING:');
      console.log(`   1. Test with: curl http://localhost:${PORT}/api/payment/quick-test`);
      console.log(`   2. Test echo: curl -X POST http://localhost:${PORT}/api/payment/echo -H "Content-Type: application/json" -d '{"test":"data"}'`);
      console.log(`   3. Check .env.development file for PAYMONGO_API_KEY`);
      console.log('='.repeat(60));
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
module.exports = app;