/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Get API URL from environment variable or use localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_BASE_URL;
