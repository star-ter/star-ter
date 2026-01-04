export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  ANALYSIS_SEARCH: `${API_BASE_URL}/analysis/search`,
  POLYGON_ADMIN: `${API_BASE_URL}/polygon/admin`,
  POLYGON_BUILDING: `${API_BASE_URL}/polygon/building`,
  POLYGON_COMMERCIAL: `${API_BASE_URL}/polygon/commercial`,
} as const;
