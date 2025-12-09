const express = require('express');
const router = express.Router();

// CORRECT: Use 'paymongoController' to match your filename
const createPayMongoController = require('../controllers/paymongoController');
const paymongoController = createPayMongoController();

// =============== PAYMONGO ROUTES ===============

// Test PayMongo connection
router.get('/test-connection', paymongoController.testConnection);

// Create checkout session
router.post('/create-checkout-session', paymongoController.createCheckoutSession);

// Verify payment
router.post('/verify-payment', paymongoController.verifyPayment);

// Create payment link
router.post('/create-payment-link', paymongoController.createPaymentLink);

// Get session details
router.get('/session/:sessionId', paymongoController.getSessionDetails);

// Webhook endpoint (must be POST)
router.post('/webhook', paymongoController.handleWebhook);

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
      webhook: 'POST /api/payment/webhook'
    }
  });
});

// Diagnostic endpoint
router.get('/diagnostics', (req, res) => {
  const diagnostics = {
    server: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
      apiBaseUrl: process.env.API_BASE_URL
    },
    paymongo: {
      apiKeyPresent: !!process.env.PAYMONGO_API_KEY,
      apiKeyPrefix: process.env.PAYMONGO_API_KEY ? 
                   process.env.PAYMONGO_API_KEY.substring(0, 10) + '...' : 'none',
      publicKeyPresent: !!process.env.PAYMONGO_PUBLIC_KEY,
      webhookSecretPresent: !!process.env.PAYMONGO_WEBHOOK_SECRET
    },
    cors: {
      origin: process.env.CORS_ORIGIN
    },
    timestamps: {
      currentTime: new Date().toISOString(),
      serverStartTime: req.app.get('startTime') || 'unknown'
    }
  };
  
  res.json({
    success: true,
    diagnostics: diagnostics
  });
});

module.exports = router;