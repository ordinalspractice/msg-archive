const DEBUG = import.meta.env.DEV;

export const logger = {
  debug: (event: string, data?: any) => {
    if (DEBUG) {
      console.debug(`[${new Date().toISOString()}] ${event}`, data || '');
    }
  },
  error: (event: string, error: any) => {
    console.error(`[${new Date().toISOString()}] ${event}`, error);
  },
  info: (event: string, data?: any) => {
    console.info(`[${new Date().toISOString()}] ${event}`, data || '');
  },
};
