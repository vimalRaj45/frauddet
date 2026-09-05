import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const getStats = async () => {
  const response = await apiClient.get('/api/stats');
  return response.data;
};

export const getNormalTransactions = async (limit = 20) => {
  const response = await apiClient.get(`/api/transactions?limit=${limit}`);
  return response.data;
};

export const getSuspiciousTransactions = async (limit = 20, status = null) => {
  const url = status 
    ? `/api/suspicious-transactions?limit=${limit}&status=${status}`
    : `/api/suspicious-transactions?limit=${limit}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getLiveFeed = async (limit = 30) => {
  const response = await apiClient.get(`/api/feed?limit=${limit}`);
  return response.data;
};

export const simulateTransaction = async (scenario = 'RANDOM', count = 1) => {
  const response = await apiClient.post('/api/simulate', {
    scenario,
    count,
  });
  return response.data;
};

// Mistral AI
export const analyzeWithMistralAI = async (txnData) => {
  const response = await apiClient.post('/api/ai/analyze', txnData);
  return response.data;
};

export const getAIMistralBriefing = async () => {
  const response = await apiClient.get('/api/ai/briefing');
  return response.data;
};

// CSV Ingestion
export const uploadCsvFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadCsvTemplateUrl = `${API_BASE_URL}/api/csv-template`;

// External API & Mock Bank
export const connectExternalApi = async (url, headers = null) => {
  const response = await apiClient.post('/api/connect-external-api', {
    url,
    headers,
  });
  return response.data;
};

export const triggerMockWebhook = async (customPayload = null) => {
  const response = await apiClient.post('/mock-bank/webhook/trigger', customPayload);
  return response.data;
};

export const getMockBankFeed = async (count = 5, includeFraudRatio = 0.4) => {
  const response = await apiClient.get(`/mock-bank/feed?count=${count}&include_fraud_ratio=${includeFraudRatio}`);
  return response.data;
};

export const clearDatabase = async () => {
  const response = await apiClient.post('/api/clear');
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
