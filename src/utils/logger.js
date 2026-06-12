const isDev = process.env.NODE_ENV === 'development';

const logger = {
  error: (...args) => {
    console.error(...args);
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
