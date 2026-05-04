import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Logistics Planner API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
