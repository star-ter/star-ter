export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  ANALYSIS_SEARCH: `${API_BASE_URL}/analysis/search`,
} as const;
