import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred'
    throw new Error(message)
  }
)

export const descriptionService = {
  // Setup
  setup: () => api.post('/setup'),

  // UC Navigation
  getCatalogs: () => api.get('/catalogs'),

  getSchemas: (catalog) => api.get(`/schemas?catalog=${catalog}`),

  getTables: (catalog, schema) => api.get(`/tables?catalog=${catalog}&schema=${schema}`),

  checkPermissions: (params) => api.post('/permissions', params),

  // Generation
  generate: (params) => api.post('/generate', params),

  // Review
  getPendingReviews: (page = 1, perPage = 20) =>
    api.get(`/pending?page=${page}&per_page=${perPage}`),

  updateReview: (id, data) => api.post(`/review/${id}`, data),

  bulkApprove: (ids, reviewer) => api.post('/review/bulk', { ids, reviewer, status: 'APPROVED' }),

  // Apply
  applyDescriptions: () => api.post('/apply'),

  // Statistics
  getStats: () => api.get('/stats'),

  getSchemaProgress: () => api.get('/schema-progress'),

  getReviewActivity: () => api.get('/review-activity'),

  getCoverage: (catalog) => api.get(`/coverage?catalog=${catalog}`),
}

export default api
