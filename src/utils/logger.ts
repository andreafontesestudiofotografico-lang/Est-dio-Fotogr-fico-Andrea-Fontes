type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
  log: (module: string, message: string, data?: any, level: LogLevel = 'info') => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${module.toUpperCase()}] ${message}`;
    
    if (level === 'error') {
      console.error(formattedMessage, data || '');
    } else if (level === 'warn') {
      console.warn(formattedMessage, data || '');
    } else {
      console.log(formattedMessage, data || '');
    }
    
    // In the future, this can be seamlessly wired to Sentry, Datadog or Firestore logs collection
  },
  
  info: (module: string, message: string, data?: any) => logger.log(module, message, data, 'info'),
  warn: (module: string, message: string, data?: any) => logger.log(module, message, data, 'warn'),
  error: (module: string, message: string, data?: any) => logger.log(module, message, data, 'error'),
};
