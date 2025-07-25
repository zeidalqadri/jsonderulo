import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Handle database constraint errors
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: any = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: isDevelopment || statusCode < 500 ? message : 'Something went wrong',
  };

  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.details = {
      name: error.name,
      originalMessage: error.message,
    };
  }

  res.status(statusCode).json(errorResponse);
};

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}