import { Response } from 'express';

export const sendSuccess = (res: Response, statusCode: number, data: unknown, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, statusCode: number, message = 'Error') => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
