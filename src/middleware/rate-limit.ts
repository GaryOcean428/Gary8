import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const createRateLimiter = (service: keyof typeof config.services) => {
  const limits = config.services[service].rateLimits;
  
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: limits.requestsPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
  });
};
