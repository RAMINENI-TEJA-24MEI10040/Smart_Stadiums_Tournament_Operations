/**
 * Structured logger utility for production-grade telemetry.
 * In production mode, outputs JSON stringified logs. In development,
 * outputs formatted color/readable console text.
 */
export const logger = {
  /**
   * Log an informational message.
   * @param message Description of the event
   * @param meta Optional structured metadata context
   */
  info: (message: string, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'INFO', timestamp, message, ...meta }));
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  /**
   * Log a warning message.
   * @param message Description of the warning
   * @param meta Optional structured metadata context
   */
  warn: (message: string, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ level: 'WARN', timestamp, message, ...meta }));
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  /**
   * Log an error details block.
   * @param message Description of the error situation
   * @param error The raw error object or message
   * @param meta Optional structured metadata context
   */
  error: (message: string, error?: unknown, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };

    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ level: 'ERROR', timestamp, message, ...errorDetails, ...meta }));
    } else {
      console.error(
        `[ERROR] [${timestamp}] ${message}`,
        error instanceof Error ? error.stack : error,
        meta ? JSON.stringify(meta) : ''
      );
    }
  }
};
