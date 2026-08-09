require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import route files
const authRoutes = require('./routes/auth.routes');
const studentDashboardRoutes = require('./routes/dashboardRoutes');
const adminDashboardRoutes = require('./routes/admin.dashboard.routes');
const collegeRoutes = require('./routes/admin.college.routes');
const assessmentRoutes = require('./routes/admin.assessment.routes');
const companyRoutes = require('./routes/company.routes');
const trainingRoutes = require('./routes/trainingRoutes');
const disputeRoutes = require('./routes/admin.dispute.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/student/dashboard', studentDashboardRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/colleges', collegeRoutes);
app.use('/api/v1/admin/assessments', assessmentRoutes);
app.use('/api/v1/admin/company', companyRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/company/training', trainingRoutes);
app.use('/api/v1/admin/disputes', disputeRoutes);

// Landing endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Pragati Placement Portal Backend REST API',
    status: 'Running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
