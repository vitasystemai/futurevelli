const API_BASE_URL = 'http://localhost:3000';

// API Response Handler
const handleApiResponse = async (response) => {
    if (!response.ok) {
        // Try to get error message from response
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Something went wrong');
        } catch (error) {
            throw new Error(response.statusText || 'Network response was not ok');
        }
    }
    return response.json();
};

// API Error Handler
const handleApiError = (error, showToast = true) => {
    console.error('API Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    
    if (showToast) {
        // Show error message to user (you can replace this with your preferred notification system)
        alert(errorMessage);
    }
    
    // Handle specific error cases
    if (error.message === 'Not authorized, no token' || error.message === 'Not authorized, token failed') {
        // Clear stored credentials and redirect to login
        localStorage.removeItem('userToken');
        window.location.href = '/login';
    }
    
    return { error: errorMessage };
};

// API Request with Retry
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            return await handleApiResponse(response);
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    
    throw lastError;
};

// Example API call with error handling
const makeApiCall = async (endpoint, options = {}) => {
    try {
        // Add authorization header if token exists
        const token = localStorage.getItem('userToken');
        if (token) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`
            };
        }
        
        return await fetchWithRetry(`/api${endpoint}`, options);
    } catch (error) {
        return handleApiError(error);
    }
};

// Export the utility functions
module.exports = {
    handleApiResponse,
    handleApiError,
    fetchWithRetry,
    makeApiCall
};
