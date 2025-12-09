// test-checkout.js
const axios = require('axios');

async function testCheckout() {
  try {
    console.log('🧪 Testing checkout session creation...\n');
    
    const payload = {
      items: [
        {
          name: "Cessati Linen Sinti",
          price: 44.99,
          quantity: 1,
          description: "Premium linen shirt"
        }
      ],
      totalAmount: 44.99,
      orderId: `TEST${Date.now()}`,
      customerInfo: {
        name: "Theresa Guillermo",
        email: "marloguiltermo@gmail.com",
        phone: "+63 912 345 6789"
      },
      paymentMethod: "gcash"
    };
    
    console.log('📤 Sending test checkout request...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      'http://localhost:5000/api/payment/create-checkout-session',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('\n✅ Checkout session created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.checkoutUrl) {
      console.log('\n🔗 Checkout URL:', response.data.checkoutUrl);
      console.log('\n💡 Open this URL in your browser to test payment.');
    }
    
  } catch (error) {
    console.error('\n❌ Checkout test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.error?.includes('Invalid PayMongo API key')) {
        console.error('\n⚠️  YOUR PAYMONGO API KEY IS INVALID!');
        console.error('Solution:');
        console.error('1. Go to https://dashboard.paymongo.com');
        console.error('2. Navigate to Developers → API Keys');
        console.error('3. Create a new Secret Key for TEST mode');
        console.error('4. Update your .env file with the new key');
        console.error('5. Restart your backend');
      }
    } else if (error.request) {
      console.error('No response received - Backend might not be running');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCheckout();