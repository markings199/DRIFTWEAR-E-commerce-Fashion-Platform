import React, { useState, useEffect } from 'react';
import '../css/PayMongoCheckout.css';

const PayMongoCheckout = ({ order, onSuccess, onError, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) {
      initializePayment();
    }
  }, [order]);

  const initializePayment = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create payment intent with PayMongo
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(order.totalAmount * 100), // Convert to centavos
          currency: 'PHP',
          description: `Order ${order.id}`,
          paymentMethod: 'gcash' // or 'paymaya' based on selection
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentData = await response.json();

      if (paymentData.checkout_url) {
        setPaymentUrl(paymentData.checkout_url);
        // Open payment URL in new window/tab
        window.open(paymentData.checkout_url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      // Check payment status
      const response = await fetch(`/api/payments/check-status/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const statusData = await response.json();
        if (statusData.status === 'paid') {
          onSuccess(statusData);
          onClose();
        } else {
          setError('Payment not completed. Please try again.');
        }
      } else {
        throw new Error('Failed to check payment status');
      }
    } catch (err) {
      console.error('Payment status check error:', err);
      setError('Failed to verify payment. Please contact support.');
      onError(err);
    }
  };

  return (
    <div className="paymongo-checkout-overlay">
      <div className="paymongo-checkout-modal">
        <div className="paymongo-checkout-header">
          <h3>Complete Your Payment</h3>
          <button className="paymongo-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="paymongo-checkout-content">
          {isLoading && (
            <div className="paymongo-loading">
              <div className="paymongo-spinner"></div>
              <p>Initializing payment...</p>
            </div>
          )}

          {error && (
            <div className="paymongo-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
              <button className="paymongo-retry-btn" onClick={initializePayment}>
                Try Again
              </button>
            </div>
          )}

          {paymentUrl && !error && (
            <div className="paymongo-payment-ready">
              <div className="paymongo-payment-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h4>Payment Link Generated</h4>
              <p>A payment link has been opened in a new tab. Please complete your payment there.</p>

              <div className="paymongo-order-summary">
                <div className="paymongo-summary-item">
                  <span>Order ID:</span>
                  <span>{order.id}</span>
                </div>
                <div className="paymongo-summary-item">
                  <span>Amount:</span>
                  <span>₱{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="paymongo-actions">
                <button
                  className="paymongo-check-status-btn"
                  onClick={handlePaymentComplete}
                >
                  <i className="fas fa-check"></i>
                  I've Completed Payment
                </button>
                <button
                  className="paymongo-open-link-btn"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <i className="fas fa-external-link-alt"></i>
                  Open Payment Link Again
                </button>
              </div>

              <div className="paymongo-instructions">
                <h5>Payment Instructions:</h5>
                <ol>
                  <li>Click the payment link that opened in a new tab</li>
                  <li>Follow the instructions to complete your payment</li>
                  <li>Return to this page and click "I've Completed Payment"</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayMongoCheckout;
