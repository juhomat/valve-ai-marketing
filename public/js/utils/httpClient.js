/**
 * Valve AI Marketing - Base HTTP Client
 * Simple, extensible HTTP client for API calls and webhooks
 */

class HttpClient {
    constructor(baseURL = '', options = {}) {
        this.baseURL = baseURL;
        this.defaultOptions = {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            ...options
        };
    }

    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Response data
     */
    async request(url, options = {}) {
        const fullUrl = this.baseURL + url;
        const config = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            // Show loading state
            this.onLoadingStart?.(fullUrl, config);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(fullUrl, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle response
            const result = await this.handleResponse(response);
            
            // Hide loading state
            this.onLoadingEnd?.(fullUrl, config);
            
            return result;

        } catch (error) {
            this.onLoadingEnd?.(fullUrl, config);
            throw this.handleError(error, fullUrl, config);
        }
    }

    /**
     * Handle fetch response
     * @param {Response} response - Fetch response
     * @returns {Promise} Parsed response data
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await this.parseResponseBody(response);
            throw new HttpError(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData,
                response
            );
        }

        return await this.parseResponseBody(response);
    }

    /**
     * Parse response body based on content type
     * @param {Response} response - Fetch response
     * @returns {Promise} Parsed data
     */
    async parseResponseBody(response) {
        const contentType = response.headers.get('content-type');
        
        // Always read as text first to avoid "body stream already read" errors
        let text;
        try {
            text = await response.text();
        } catch (e) {
            console.error('Failed to read response as text:', e);
            return await response.blob();
        }
        
        // Try to parse as JSON first (for explicit JSON content-type or JSON-like content)
        if (contentType?.includes('application/json') || 
            text.trim().startsWith('{') || 
            text.trim().startsWith('[')) {
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn('Failed to parse as JSON, returning as text:', e);
                return text;
            }
        }
        
        // Return as text for all other cases
        return text;
    }

    /**
     * Handle errors consistently
     * @param {Error} error - Original error
     * @param {string} url - Request URL
     * @param {Object} config - Request config
     * @returns {HttpError} Formatted error
     */
    handleError(error, url, config) {
        if (error instanceof HttpError) {
            return error;
        }

        if (error.name === 'AbortError') {
            return new HttpError('Request timeout', 408, { timeout: config.timeout }, null);
        }

        if (!navigator.onLine) {
            return new HttpError('No internet connection', 0, { offline: true }, null);
        }

        return new HttpError(
            error.message || 'Network error occurred',
            0,
            { originalError: error.name },
            null
        );
    }

    // HTTP Methods
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    async patch(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    // Utility methods
    setAuthToken(token) {
        this.defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    removeAuthToken() {
        delete this.defaultOptions.headers['Authorization'];
    }

    setBaseURL(baseURL) {
        this.baseURL = baseURL;
    }

    // Event handlers (can be overridden)
    onLoadingStart(url, config) {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
    }

    onLoadingEnd(url, config) {
        console.log(`✅ API Response: ${config.method || 'GET'} ${url}`);
    }
}

/**
 * Custom HTTP Error class
 */
class HttpError extends Error {
    constructor(message, status, data, response) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.data = data;
        this.response = response;
    }

    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    get isServerError() {
        return this.status >= 500;
    }

    get isNetworkError() {
        return this.status === 0;
    }
}

/**
 * Create default HTTP client instance
 */
const createHttpClient = (baseURL = '', options = {}) => {
    return new HttpClient(baseURL, options);
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HttpClient, HttpError, createHttpClient };
} else {
    // Browser environment
    window.HttpClient = HttpClient;
    window.HttpError = HttpError;
    window.createHttpClient = createHttpClient;
}
