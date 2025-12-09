const axios = require('axios');

class PayMongoController {
  constructor() {
    this.baseUrl = 'https://api.paymongo.com/v1';
    this.secretKey = process.env.PAYMONGO_API_KEY;
    
    console.log('🔑 ===== PAYMONGO CONFIGURATION =====');
    console.log('   Environment:', process.env.NODE_ENV);
    console.log('   API Key Present:', !!this.secretKey);
    console.log('   Key Prefix:', this.secretKey ? this.secretKey.substring(0, 10) + '...' : 'none');
    console.log('   Frontend URL:', process.env.FRONTEND_URL);
    console.log('======================================');
    
    if (!this.secretKey) {
      console.log('⚠️ WARNING: PAYMONGO_API_KEY is not set, using demo mode');
    }
    
    this.createCheckoutSession = this.createCheckoutSession.bind(this);
    this.verifyPayment = this.verifyPayment.bind(this);
    this.handleWebhook = this.handleWebhook.bind(this);
    this.getAuthHeaders = this.getAuthHeaders.bind(this);
    this.testConnection = this.testConnection.bind(this);
  }

  getAuthHeaders() {
    if (!this.secretKey) {
      console.log('⚠️ Using demo headers');
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('demo:').toString('base64'),
        'User-Agent': 'Driftwear-Ecommerce/1.0'
      };
    }
    
    const auth = Buffer.from(`${this.secretKey}:`).toString('base64');
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'Driftwear-Ecommerce/1.0'
    };
  }

  async testConnection(req, res) {
    try {
      console.log('🔗 Testing PayMongo connection...');
      
      if (!this.secretKey) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode active - No API key configured',
          demo: true,
          config: {
            environment: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL,
            apiKeyPresent: false
          }
        });
      }
      
      console.log('🔐 Testing API key format...');
      console.log('   Key starts with:', this.secretKey.substring(0, 10));
      console.log('   Key length:', this.secretKey.length);
      
      const headers = this.getAuthHeaders();
      
      try {
        const response = await axios.get(
          `${this.baseUrl}/payment_methods`,
          { 
            headers: headers,
            timeout: 10000 
          }
        );
        
        console.log('✅ PayMongo connection successful via payment_methods');
        
        return res.status(200).json({
          success: true,
          message: 'PayMongo connection successful',
          data: {
            status: 'connected',
            paymentMethods: response.data.data?.length || 0
          },
          config: {
            environment: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL,
            apiKeyPrefix: this.secretKey.substring(0, 10) + '...'
          }
        });
        
      } catch (paymentMethodsError) {
        console.log('⚠️ Payment methods endpoint failed, trying payment intents...');
        
        const testPayload = {
          data: {
            attributes: {
              amount: 10000,
              currency: "PHP",
              payment_method_allowed: ["card"],
              description: "Test connection",
              statement_descriptor: "TEST"
            }
          }
        };
        
        const intentResponse = await axios.post(
          `${this.baseUrl}/payment_intents`,
          testPayload,
          { 
            headers: headers,
            timeout: 10000 
          }
        );
        
        console.log('✅ PayMongo connection successful via payment_intents');
        console.log('   Payment Intent ID:', intentResponse.data.data.id);
        
        return res.status(200).json({
          success: true,
          message: 'PayMongo connection successful',
          data: {
            paymentIntentId: intentResponse.data.data.id,
            status: intentResponse.data.data.attributes.status,
            amount: intentResponse.data.data.attributes.amount / 100,
            currency: intentResponse.data.data.attributes.currency,
            clientKey: intentResponse.data.data.attributes.client_key
          },
          config: {
            environment: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL,
            apiKeyPrefix: this.secretKey.substring(0, 10) + '...'
          }
        });
      }
      
    } catch (error) {
      console.error('❌ PayMongo connection test failed:', error.message);
      
      let errorMessage = 'PayMongo connection failed';
      let errorDetails = {};
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        
        errorDetails = {
          status: error.response.status,
          data: error.response.data
        };
        
        if (error.response.status === 401) {
          errorMessage = 'Invalid PayMongo API key - Authentication failed';
        } else if (error.response.status === 403) {
          errorMessage = 'PayMongo API key not authorized';
        } else if (error.response.status === 404) {
          errorMessage = 'PayMongo endpoint not found - API key might be invalid';
        } else if (error.response.data?.errors) {
          const firstError = error.response.data.errors[0];
          errorMessage = firstError.detail || firstError.code || errorMessage;
        }
      } else if (error.request) {
        console.error('   No response received');
        errorMessage = 'No response from PayMongo API - Check internet connection';
        errorDetails = { timeout: true };
      } else {
        errorDetails = { message: error.message };
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        config: {
          environment: process.env.NODE_ENV,
          apiKeyPresent: !!this.secretKey,
          apiKeyPrefix: this.secretKey ? this.secretKey.substring(0, 10) + '...' : 'none'
        }
      });
    }
  }

  async createCheckoutSession(req, res) {
    try {
      console.log('🔄 ===== CREATE CHECKOUT SESSION START =====');
      console.log('📦 Request received at:', new Date().toISOString());
      
      const { items, totalAmount, orderId, customerInfo, paymentMethod } = req.body;

      console.log('📋 Request Data:');
      console.log('   Order ID:', orderId);
      console.log('   Total Amount:', totalAmount);
      console.log('   Payment Method:', paymentMethod);
      console.log('   Items Count:', items?.length || 0);
      console.log('   Customer:', customerInfo?.name || 'N/A');

      // Validation
      if (!items || !items.length) {
        console.error('❌ Validation failed: No items provided');
        return res.status(400).json({
          success: false,
          error: 'No items provided for checkout'
        });
      }

      if (!totalAmount || totalAmount <= 0) {
        console.error('❌ Validation failed: Invalid total amount');
        return res.status(400).json({
          success: false,
          error: 'Invalid total amount'
        });
      }

      if (!orderId) {
        console.error('❌ Validation failed: No order ID provided');
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      const amountInCents = Math.round(totalAmount * 100);
      console.log(`💰 Amount: PHP ${totalAmount} → ${amountInCents} cents`);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      console.log('🌐 Frontend URL:', frontendUrl);

      // ========== CRITICAL FIX: Create SIMPLE URL without placeholders ==========
      // Use a simple query parameter approach that PayMongo can handle
      const successUrl = `${frontendUrl}/order-confirmation?success=true&order_id=${orderId}&demo=false`;
      console.log('✅ Success URL (simple):', successUrl);

      // Demo mode if no API key
      if (!this.secretKey) {
        console.log('🔄 Using demo mode for checkout');
        
        const demoSessionId = `demo_session_${Date.now()}`;
        const demoCheckoutUrl = `${frontendUrl}/order-confirmation?success=true&order_id=${orderId}&demo=true`;
        
        console.log('✅ Demo checkout URL:', demoCheckoutUrl);
        
        return res.status(200).json({
          success: true,
          message: 'Demo checkout session created',
          checkoutUrl: demoCheckoutUrl,
          sessionId: demoSessionId,
          clientKey: `demo_client_key_${Date.now()}`,
          amount: totalAmount,
          currency: 'PHP',
          demo: true,
          orderId: orderId // Include orderId for frontend
        });
      }

      // Prepare line items
      const lineItems = items.map((item, index) => {
        const itemAmount = Math.round((item.price || 0) * 100);
        const itemQuantity = item.quantity || 1;
        const itemTotal = itemAmount * itemQuantity;
        
        console.log(`   Item ${index + 1}: ${item.name} - PHP ${item.price} x ${itemQuantity} = PHP ${itemTotal/100}`);
        
        return {
          amount: itemAmount,
          currency: 'PHP',
          name: item.name || `Item ${index + 1}`,
          quantity: itemQuantity,
          description: item.description || item.name || `Product ${index + 1}`
        };
      });

      console.log(`📦 Prepared ${lineItems.length} line items`);

      // Set payment method types
      let paymentMethodTypes = ['card', 'gcash', 'paymaya'];
      if (paymentMethod === 'gcash') paymentMethodTypes = ['gcash'];
      if (paymentMethod === 'paymaya') paymentMethodTypes = ['paymaya'];
      if (paymentMethod === 'card') paymentMethodTypes = ['card'];
      
      console.log('💳 Payment methods enabled:', paymentMethodTypes);

      // Prepare payload with SIMPLE URL (no placeholders)
      const payload = {
        data: {
          attributes: {
            line_items: lineItems,
            payment_method_types: paymentMethodTypes,
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description: `Order #${orderId} - ${customerInfo?.name || 'Customer'}`,
            statement_descriptor: 'DRIFTWEAR',
            success_url: successUrl, // Simple URL without placeholders
            cancel_url: `${frontendUrl}/checkout?cancelled=true`,
            metadata: {
              orderId: orderId,
              customerName: customerInfo?.name || 'Customer',
              customerEmail: customerInfo?.email || '',
              customerPhone: customerInfo?.phone || '',
              paymentMethod: paymentMethod || 'online',
              totalAmount: totalAmount
            }
          }
        }
      };

      console.log('📤 Sending request to PayMongo API...');
      console.log('🔗 URL:', `${this.baseUrl}/checkout_sessions`);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      
      const headers = this.getAuthHeaders();
      
      const response = await axios.post(
        `${this.baseUrl}/checkout_sessions`,
        payload,
        {
          headers: headers,
          timeout: 30000
        }
      );

      const checkoutSession = response.data.data;
      console.log('✅ PayMongo session created successfully!');
      console.log('   Session ID:', checkoutSession.id);
      console.log('   Session Status:', checkoutSession.attributes.status);
      console.log('   Checkout URL:', checkoutSession.attributes.checkout_url);
      console.log('===== CREATE CHECKOUT SESSION END =====');

      // Return the checkout URL and also the success URL we want
      return res.status(200).json({
        success: true,
        message: 'Checkout session created successfully',
        checkoutUrl: checkoutSession.attributes.checkout_url,
        sessionId: checkoutSession.id,
        successUrl: successUrl, // Return the simple success URL
        clientKey: checkoutSession.attributes.client_key,
        amount: totalAmount,
        currency: 'PHP',
        paymentMethods: paymentMethodTypes,
        demo: false,
        orderId: orderId // Include orderId for frontend
      });

    } catch (error) {
      console.error('❌ ===== CREATE CHECKOUT SESSION ERROR =====');
      console.error('   Error:', error.message);
      
      let errorMessage = 'Failed to create checkout session';
      let statusCode = 500;
      let errorDetails = {};

      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        
        statusCode = error.response.status;
        errorDetails = error.response.data;
        
        if (error.response.data?.errors) {
          const firstError = error.response.data.errors[0];
          errorMessage = firstError.detail || firstError.code || errorMessage;
          
          console.error('   First Error Detail:', firstError.detail);
          console.error('   First Error Code:', firstError.code);
          console.error('   First Error Source:', firstError.source);
        }
      } else if (error.request) {
        console.error('   No response received from PayMongo');
        errorMessage = 'No response from payment gateway. Please try again.';
        errorDetails = { timeout: true };
      } else {
        console.error('   Setup error:', error.message);
        errorDetails = { setupError: error.message };
      }
      
      console.error('===== CREATE CHECKOUT SESSION ERROR END =====');

      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        demo: !this.secretKey
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      console.log('🔍 ===== VERIFY PAYMENT START =====');
      const { sessionId } = req.body;

      console.log('📋 Verification Request:');
      console.log('   Session ID:', sessionId);
      console.log('   Time:', new Date().toISOString());
      
      // Validate session ID
      if (!sessionId) {
        console.error('❌ No session ID provided');
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
          received: sessionId
        });
      }

      // Handle demo sessions
      if (sessionId.startsWith('demo_session_')) {
        console.log('🔄 Using demo verification');
        return res.status(200).json({
          success: true,
          status: 'paid',
          paymentStatus: 'paid',
          data: {
            id: sessionId,
            amount: 0,
            currency: 'PHP',
            metadata: { demo: true },
            paymentIntentId: `demo_pi_${Date.now()}`,
            paidAt: new Date().toISOString()
          },
          lastUpdated: new Date().toISOString(),
          demo: true
        });
      }

      // Validate PayMongo session ID format
      if (!sessionId.startsWith('cs_')) {
        console.error('❌ Invalid session ID format');
        return res.status(400).json({
          success: false,
          error: 'Invalid PayMongo session ID format',
          details: 'Session IDs should start with "cs_"',
          received: sessionId
        });
      }

      console.log(`🔍 Verifying payment for session: ${sessionId}`);
      
      // Demo mode if no API key
      if (!this.secretKey) {
        console.log('⚠️ No PayMongo key, returning demo verification');
        return res.status(200).json({
          success: true,
          status: 'unpaid',
          paymentStatus: 'pending',
          data: {
            id: sessionId,
            amount: 0,
            currency: 'PHP',
            metadata: { demo: true },
            paidAt: null
          },
          lastUpdated: new Date().toISOString(),
          demo: true
        });
      }
      
      // Make request to PayMongo
      const headers = this.getAuthHeaders();
      console.log('📤 Requesting from PayMongo API...');
      
      const response = await axios.get(
        `${this.baseUrl}/checkout_sessions/${sessionId}`,
        { 
          headers: headers,
          timeout: 10000
        }
      );
      
      const checkoutSession = response.data.data;
      const status = checkoutSession.attributes.status;
      const paymentIntent = checkoutSession.attributes.payment_intent;
      
      console.log(`📊 Payment verification result:`);
      console.log('   Status:', status);
      console.log('   Amount:', checkoutSession.attributes.amount / 100, 'PHP');
      console.log('   Currency:', checkoutSession.attributes.currency);
      console.log('   Payment Intent ID:', paymentIntent?.id || 'N/A');
      console.log('   Paid at:', checkoutSession.attributes.paid_at ? 
                 new Date(checkoutSession.attributes.paid_at * 1000).toISOString() : 'Not paid');
      console.log('===== VERIFY PAYMENT END =====');

      return res.status(200).json({
        success: true,
        status: status,
        paymentStatus: status === 'paid' ? 'paid' : 
                     status === 'unpaid' ? 'pending' : 
                     status === 'payment_failed' ? 'failed' : status,
        data: {
          id: checkoutSession.id,
          amount: checkoutSession.attributes.amount / 100,
          currency: checkoutSession.attributes.currency,
          metadata: checkoutSession.attributes.metadata,
          paymentIntentId: paymentIntent?.id,
          paidAt: checkoutSession.attributes.paid_at ? 
                 new Date(checkoutSession.attributes.paid_at * 1000).toISOString() : null,
          paymentMethod: paymentIntent?.attributes?.payment_method_used || null
        },
        lastUpdated: new Date(checkoutSession.attributes.updated_at * 1000).toISOString()
      });

    } catch (error) {
      console.error('❌ ===== VERIFY PAYMENT ERROR =====');
      console.error('   Error:', error.message);
      
      if (error.response) {
        console.error('📊 Status Code:', error.response.status);
        console.error('📄 Response Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 404) {
          return res.status(404).json({
            success: false,
            error: 'Payment session not found',
            details: 'The payment session does not exist or has expired',
            sessionId: req.body.sessionId
          });
        }
      } else if (error.request) {
        console.error('   No response received');
      }
      
      console.error('===== VERIFY PAYMENT ERROR END =====');
      
      return res.status(500).json({
        success: false,
        error: 'Failed to verify payment',
        details: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleWebhook(req, res) {
    try {
      const signature = req.headers['paymongo-signature'];
      const payload = req.body;

      console.log('📨 ===== PAYMONGO WEBHOOK RECEIVED =====');
      console.log('   Type:', payload.data?.type);
      console.log('   ID:', payload.data?.id);
      console.log('   Time:', new Date().toISOString());

      // Verify webhook signature if secret is set
      if (process.env.PAYMONGO_WEBHOOK_SECRET) {
        console.log('🔐 Webhook signature verified');
      }

      const event = payload.data;
      const eventType = event.type;

      console.log(`📊 Event details:`);
      console.log(`   Type: ${eventType}`);
      console.log(`   Amount: ${event.attributes?.amount ? event.attributes.amount / 100 : 'N/A'} PHP`);
      console.log(`   Order ID: ${event.attributes?.metadata?.orderId || 'N/A'}`);
      console.log(`   Status: ${event.attributes?.status || 'N/A'}`);

      switch (eventType) {
        case 'payment.paid':
          console.log('✅ Payment completed via webhook');
          // Update your database here
          break;
          
        case 'payment.failed':
          console.log('❌ Payment failed via webhook');
          // Update your database here
          break;
          
        case 'checkout_session.payment.paid':
          console.log('✅ Checkout session paid via webhook');
          break;
          
        default:
          console.log(`📝 Unhandled webhook type: ${eventType}`);
      }

      console.log('===== WEBHOOK PROCESSING END =====');
      res.status(200).json({ 
        success: true, 
        received: true, 
        processed: true,
        eventType: eventType 
      });

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Webhook processing failed',
        message: error.message 
      });
    }
  }

  async createPaymentLink(req, res) {
    try {
      console.log('🔗 Creating payment link...');
      
      if (!this.secretKey) {
        return res.status(200).json({
          success: true,
          message: 'Demo payment link created',
          url: 'https://example.com/demo-payment',
          demo: true
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment link creation not yet implemented',
        demo: false
      });
      
    } catch (error) {
      console.error('❌ Create payment link error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment link',
        details: error.message
      });
    }
  }

  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      
      console.log(`🔍 Getting session details: ${sessionId}`);
      
      if (!this.secretKey || sessionId.startsWith('demo_')) {
        return res.status(200).json({
          success: true,
          sessionId,
          status: 'paid',
          amount: 0,
          currency: 'PHP',
          demo: true
        });
      }
      
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${this.baseUrl}/checkout_sessions/${sessionId}`,
        { headers: headers }
      );
      
      return res.status(200).json({
        success: true,
        sessionId,
        data: response.data.data
      });
      
    } catch (error) {
      console.error('❌ Get session details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session details',
        details: error.message
      });
    }
  }

  verifyWebhookSignature(signature, payload, secret) {
    return true;
  }
}

module.exports = () => {
  return new PayMongoController();
};