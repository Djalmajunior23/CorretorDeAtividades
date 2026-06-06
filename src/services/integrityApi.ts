import apiService from './apiService';

export const integrityApi = {
  analyzeActivity: async (payload: { teacher_id: number; activity_name: string }) => {
    const response = await apiService.post('/academic-integrity/analyze', payload);
    return response.data;
  },

  getReports: async () => {
    const response = await apiService.get('/academic-integrity/reports');
    return response.data;
  },

  getReportDetails: async (id: number) => {
    const response = await apiService.get(`/academic-integrity/reports/${id}`);
    return response.data;
  },
  
  reviewCase: async (id: number, payload: { status: string; notes: string }) => {
    const response = await apiService.put(`/academic-integrity/cases/${id}/review`, payload);
    return response.data;
  }
};
