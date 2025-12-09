const express = require('express');
const router = express.Router();

// Create PayMongo controller
const createPayMongoController = require('../controllers/paymongoController');
const paymongoController = createPayMongoController();

// =============== PAYMONGO ROUTES ===============

// Test PayMongo connection
router.get('/test-connection', paymongoController.testConnection);

// Create checkout session - ADD EXTRA DEBUGGING
router.post('/create-checkout-session', (req, res, next) => {
  console.log('🔍 ===== CHECKOUT SESSION REQUEST DEBUG =====');
  console.log('📅 Time:', new Date().toISOString());
  console.log('📦 Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📋 Content-Type:', req.headers['content-type']);
  
  // Check if body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('❌ EMPTY REQUEST BODY DETECTED!');
    
    // Try to log raw body
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('📄 Raw body received:', rawBody);
      console.log('📄 Raw body length:', rawBody.length);
      
      // Try to parse it manually
      try {
        if (rawBody.trim()) {
          const parsedBody = JSON.parse(rawBody);
          console.log('✅ Manually parsed body:', JSON.stringify(parsedBody, null, 2));
          // Re-attach parsed body to request
          req.body = parsedBody;
          // Continue to the actual controller
          return paymongoController.createCheckoutSession(req, res);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse raw body:', parseError.message);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Empty or invalid request body',
        details: 'Please send valid JSON with items, totalAmount, and orderId',
        example: {
          orderId: 'ORD12345',
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
            firstName: 'Charis',
            lastName: 'Test',
            email: 'charis@example.com'
          }
        }
      });
    });
    
    return;
  }
  
  // Body exists, log it
  console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  console.log('📊 Body has items?:', Array.isArray(req.body.items) && req.body.items.length > 0);
  console.log('📊 Body has totalAmount?:', req.body.totalAmount);
  console.log('📊 Body has orderId?:', req.body.orderId);
  console.log('===== END DEBUG =====');
  
  // Continue to actual controller
  next();
}, paymongoController.createCheckoutSession);

// Verify payment
router.post('/verify-payment', paymongoController.verifyPayment);

// Webhook endpoint
router.post('/webhook', paymongoController.handleWebhook);

// =============== NEW DEBUG ROUTES ===============

// Test endpoint with sample data
router.post('/test-create-session', (req, res) => {
  console.log('🧪 Test endpoint hit');
  
  const sampleData = {
    orderId: `TEST-${Date.now()}`,
    totalAmount: 79.99,
    items: [
      {
        name: 'Hooded Jacket',
        price: 79.99,
        quantity: 1,
        size: 'M',
        color: 'Blue',
        description: 'Premium hooded jacket'
      }
    ],
    customerInfo: {
      firstName: 'Charis',
      lastName: 'Test',
      email: 'charis@example.com',
      phone: '1234567890'
    },
    paymentMethod: 'card'
  };
  
  console.log('📋 Sample data:', JSON.stringify(sampleData, null, 2));
  
  // Mock the response to test frontend
  const mockResponse = {
    success: true,
    message: 'Test checkout session created',
    checkoutUrl: 'https://checkout.paymongo.com/demo-checkout',
    sessionId: `test_session_${Date.now()}`,
    clientKey: `test_client_${Date.now()}`,
    amount: 79.99,
    currency: 'PHP',
    paymentMethods: ['card'],
    demo: true,
    orderId: sampleData.orderId
  };
  
  res.json(mockResponse);
});

// Echo endpoint - returns exactly what you send
router.post('/echo', (req, res) => {
  console.log('🔄 Echo endpoint hit');
  console.log('📦 Body received:', req.body);
  console.log('📄 Raw body available:', req.rawBody);
  
  res.json({
    success: true,
    message: 'Echo response',
    receivedAt: new Date().toISOString(),
    yourData: req.body,
    headers: {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      origin: req.headers['origin']
    }
  });
});

// Simple health check for payment route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: 'GET /api/payment/test',
      testConnection: 'GET /api/payment/test-connection',
      createCheckout: 'POST /api/payment/create-checkout-session',
      verifyPayment: 'POST /api/payment/verify-payment',
      testCreate: 'POST /api/payment/test-create-session',
      echo: 'POST /api/payment/echo',
      diagnostics: 'GET /api/payment/diagnostics'
    },
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    paymongoKeyPresent: !!process.env.PAYMONGO_API_KEY
  });
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'PayMongo payment API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      testConnection: 'GET /api/payment/test-connection',
      createCheckout: 'POST /api/payment/create-checkout-session',
      verifyPayment: 'POST /api/payment/verify-payment',
      webhook: 'POST /api/payment/webhook',
      testCreate: 'POST /api/payment/test-create-session',
      echo: 'POST /api/payment/echo'
    },
    examplePayload: {
      orderId: 'ORD12345',
      totalAmount: 79.99,
      items: [
        {
          name: 'Product Name',
          price: 79.99,
          quantity: 1,
          size: 'M',
          color: 'Blue',
          description: 'Product description'
        }
      ],
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890'
      },
      paymentMethod: 'card'
    }
  });
});

// Diagnostic endpoint - UPDATED
router.get('/diagnostics', (req, res) => {
  const diagnostics = {
    server: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
      host: process.env.HOST,
      apiBaseUrl: process.env.API_BASE_URL
    },
    paymongo: {
      apiKeyPresent: !!process.env.PAYMONGO_API_KEY,
      apiKeyPrefix: process.env.PAYMONGO_API_KEY ? 
                   process.env.PAYMONGO_API_KEY.substring(0, 10) + '...' : 'none',
      publicKeyPresent: !!process.env.PAYMONGO_PUBLIC_KEY,
      webhookSecretPresent: !!process.env.PAYMONGO_WEBHOOK_SECRET,
      keyType: process.env.PAYMONGO_API_KEY ? 
              (process.env.PAYMONGO_API_KEY.startsWith('sk_test_') ? 'Test' : 
               process.env.PAYMONGO_API_KEY.startsWith('sk_live_') ? 'Live' : 'Unknown') : 'None'
    },
    cors: {
      origin: process.env.CORS_ORIGIN,
      allowedOrigins: process.env.CORS_ORIGIN ? 
                     process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173']
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  };
  
  res.json({
    success: true,
    diagnostics: diagnostics,
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  });
});

// Quick test endpoint
router.get('/quick-test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Payment route is accessible!',
    serverTime: new Date().toISOString(),
    nextStep: 'Try POST /api/payment/test-create-session with sample data'
  });
});

module.exports = router;