/**
 * Database Connection Module
 * 
 * IMPORTANT: This module is for SERVER-SIDE USE ONLY.
 * 
 * In React Native/Expo apps, you CANNOT connect directly to SQL Server because:
 * 1. The 'mssql' package requires Node.js runtime (not available in React Native)
 * 2. Direct database connections from mobile apps are a security risk
 * 
 * SOLUTION: Use the backend server at /server/index.js which exposes API endpoints.
 * The mobile app communicates with the backend server via HTTP requests.
 * 
 * For database operations in the mobile app, use the AuthService which calls
 * the backend API at EXPO_PUBLIC_API_URL.
 */

// This file is kept for reference/documentation purposes.
// The actual database connection is handled by server/index.js

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

/**
 * Database configuration for reference.
 * These values are loaded from .env and used by the backend server.
 */
export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_SFC || '',
};

console.warn(
  'Note: Direct database connections are not supported in React Native. ' +
  'Use the backend API server instead.'
);

export default null;