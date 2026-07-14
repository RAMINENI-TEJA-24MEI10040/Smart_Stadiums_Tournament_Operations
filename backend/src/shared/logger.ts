export const logger = {
  info: (message: string, meta?: any): void => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'INFO', timestamp, message, ...meta }));
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  warn: (message: string, meta?: any): void => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ level: 'WARN', timestamp, message, ...meta }));
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message: string, error?: any, meta?: any): void => {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
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
