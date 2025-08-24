// Simple in-memory log storage for OAuth debugging
let oauthLogs: Array<{
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  data?: any;
}> = [];

const MAX_LOGS = 100; // Keep only last 100 logs

export function logOAuth(level: 'info' | 'error' | 'warn', message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data
  };
  
  oauthLogs.unshift(logEntry);
  
  // Keep only the most recent logs
  if (oauthLogs.length > MAX_LOGS) {
    oauthLogs = oauthLogs.slice(0, MAX_LOGS);
  }
  
  // Also log to console for server logs
  console.log(`[OAuth ${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export function getOAuthLogs() {
  return oauthLogs;
}

export function clearOAuthLogs() {
  oauthLogs = [];
}