import apiService from './apiService';

export const reportsApi = {
  generateReport: async (payload: { teacher_id: number; class_name: string; title: string }) => {
    const response = await apiService.post('/pedagogical-reports/generate', payload);
    return response.data;
  },

  getReports: async () => {
    const response = await apiService.get('/pedagogical-reports');
    return response.data;
  },

  getReportDetails: async (id: number) => {
    const response = await apiService.get(`/pedagogical-reports/${id}`);
    return response.data;
  }
};
