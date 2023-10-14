import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandling/errorHandler';
import expressRateLimit from 'express-rate-limit';
import { createLogger, transports, format } from 'winston';
import { authRouter } from './routes/userRoutes';
import { solWalletRouter } from './routes/SolanaRoutes/solanaWalletRoutes';
import { solanaTransactionRouter } from './routes/SolanaRoutes/solanaTransactionRoutes';
import { solanaTokenRouter } from './routes/SolanaRoutes/solanaTokenRoutes';

import { gameApiRouter } from './routes/GameRoutes/gameRoutes';
import { realinkEndpointRouter } from './routes/SolanaRoutes/realinkEndpointRoutes';
import dataRoutes from './routes/DataRoutes/dataRoutes';
// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Create Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),

  ]
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('combined'));
app.use(helmet());
app.use(cors());
app.use(expressRateLimit({ max: 100, windowMs: 15 * 60 * 1000 })); // Rate limiting for requests
app.use(errorHandler);


// Routes
app.use('/api/v1/user', authRouter);
app.use('/api/v1/solwallet', solWalletRouter);
app.use('/api/v1/soltransaction', solanaTransactionRouter);
app.use('/api/v1/soltoken', solanaTokenRouter);
app.use('/api/v1/realink', realinkEndpointRouter);

app.use('/api/v1/game', gameApiRouter);
app.use('/api/v1/data', dataRoutes);
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

// Custom middleware for logging API requests
app.use((req, res, next) => {
  logger.info(`API request received: ${req.method} ${req.originalUrl}`);
  next();
});
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`Server is running on http://localhost:${port}`);
});
