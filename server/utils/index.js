const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load env vars
dotenv.config();

// Route files
const eyeglassRoutes = require('../routes/eyeglassRoutes');
const userRoutes = require('../routes/userRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const cartRoutes = require('../routes/cartRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const { chapaWebhookHandler } = require('../controllers/paymentController');

const app = express();

// Debug: Log ALL requests first
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Payment provider webhook endpoints (support both legacy and v1-style callback URLs)
app.post('/api/payments/webhook', express.json({ limit: '5mb' }), chapaWebhookHandler);
app.post('/api/payments/webhook/chapa', express.json({ limit: '5mb' }), chapaWebhookHandler);
app.post('/api/v1/payments/webhook/chapa', express.json({ limit: '5mb' }), chapaWebhookHandler);

// Body parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routers
console.log('Mounting routers...');
app.use('/api/eyeglasses', eyeglassRoutes);
console.log('Eyeglass routes mounted');
app.use('/api/users', userRoutes);
console.log('User routes mounted');
app.use('/api/categories', categoryRoutes);
console.log('Category routes mounted');
app.use('/api/cart', cartRoutes);
console.log('Cart routes mounted');
app.use('/api/payments', paymentRoutes);
console.log('Payment routes mounted');

// Test endpoint
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ message: 'Test works', body: req.body });
});

// 404 handler for API routes
app.use('/api', (req, res, next) => {
  console.log(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'API route not found: ' + req.originalUrl });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Eyeglass Store API' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Uploaded image is too large. Please use an image under 2 MB.' });
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
