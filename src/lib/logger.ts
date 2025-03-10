import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define custom format
const format = winston.format.combine(
  winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
  winston.format.colorize({all: true}),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [new winston.transports.Console()],
});
