/**
 * Logger utility for development-safe console logging
 *
 * This utility provides a wrapper around console methods that only logs
 * in development mode, preventing console pollution in production builds.
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Logger object with methods that respect environment
 */
export const logger = {
    /**
     * Log general information (development only)
     *
     * @param args - Arguments to log
     *
     * @example
     * logger.log('User logged in:', user);
     */
    log: (...args: any[]): void => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Log errors (always logged, even in production)
     *
     * @param args - Arguments to log
     *
     * @example
     * logger.error('Failed to fetch data:', error);
     */
    error: (...args: any[]): void => {
        console.error(...args);
    },

    /**
     * Log warnings (development only)
     *
     * @param args - Arguments to log
     *
     * @example
     * logger.warn('Deprecated function used');
     */
    warn: (...args: any[]): void => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    /**
     * Log info messages (development only)
     *
     * @param args - Arguments to log
     *
     * @example
     * logger.info('Cache cleared');
     */
    info: (...args: any[]): void => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    /**
     * Log debug information (development only)
     *
     * @param args - Arguments to log
     *
     * @example
     * logger.debug('State update:', newState);
     */
    debug: (...args: any[]): void => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },

    /**
     * Group related log messages (development only)
     *
     * @param label - Label for the group
     *
     * @example
     * logger.group('API Calls');
     * logger.log('Fetching users...');
     * logger.groupEnd();
     */
    group: (label: string): void => {
        if (isDevelopment) {
            console.group(label);
        }
    },

    /**
     * End a log group (development only)
     */
    groupEnd: (): void => {
        if (isDevelopment) {
            console.groupEnd();
        }
    },

    /**
     * Log a table (development only)
     *
     * @param data - Data to display in table format
     *
     * @example
     * logger.table(users);
     */
    table: (data: any): void => {
        if (isDevelopment) {
            console.table(data);
        }
    },

    /**
     * Start a timer (development only)
     *
     * @param label - Label for the timer
     *
     * @example
     * logger.time('API Call');
     * await fetchData();
     * logger.timeEnd('API Call');
     */
    time: (label: string): void => {
        if (isDevelopment) {
            console.time(label);
        }
    },

    /**
     * End a timer and log the elapsed time (development only)
     *
     * @param label - Label for the timer
     */
    timeEnd: (label: string): void => {
        if (isDevelopment) {
            console.timeEnd(label);
        }
    }
};

/**
 * Type-safe logger for development mode only
 * Use this when you want to ensure logging is stripped in production
 */
export const devLogger = isDevelopment ? console : {
    log: () => {},
    error: console.error, // Always log errors
    warn: () => {},
    info: () => {},
    debug: () => {},
    group: () => {},
    groupEnd: () => {},
    table: () => {},
    time: () => {},
    timeEnd: () => {}
};

export default logger;
