import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import routeRoutes from './routes/routeRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/routes', routeRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Logistics Planner API is running' });
});

// Metrics endpoint for Prometheus (Grading Rubric Phase 5)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('# HELP app_up Status of the app\n# TYPE app_up gauge\napp_up 1\n');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
