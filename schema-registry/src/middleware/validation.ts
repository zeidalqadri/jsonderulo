import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errorDetails,
      });
    }

    // Replace the original data with the validated and sanitized data
    req[property] = value;
    next();
  };
};