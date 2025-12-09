module.exports = {
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'production'
  },
  
  database: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    }
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    corsOrigin: process.env.CORS_ORIGIN,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    }
  },
  
  payment: {
    paymongo: {
      secretKey: process.env.PAYMONGO_SECRET_KEY,
      publicKey: process.env.PAYMONGO_PUBLIC_KEY,
      webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET
    }
  },
  
  shipping: {
    regular: parseFloat(process.env.SHIPPING_FEE_REGULAR) || 50.00,
    express: parseFloat(process.env.SHIPPING_FEE_EXPRESS) || 100.00,
    freeThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 1000.00
  },
  
  tax: {
    rate: parseFloat(process.env.TAX_RATE) || 0.12,
    enabled: process.env.TAX_ENABLED === 'true'
  }
};