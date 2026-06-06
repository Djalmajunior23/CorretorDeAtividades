import apiService from './apiService';

export const analyticsApi = {
  getDashboard: async () => {
    const res = await apiService.get('/analytics/teacher/dashboard');
    return res.data;
  },
  getClassSummary: async (classId: string) => {
    const res = await apiService.get(`/analytics/classes/${classId}/summary`);
    return res.data;
  },
  getStudentsRisk: async (classId: string) => {
    const res = await apiService.get(`/analytics/classes/${classId}/students-risk`);
    return res.data;
  },
  getCommonErrors: async (classId: string) => {
    const res = await apiService.get(`/analytics/classes/${classId}/common-errors`);
    return res.data;
  },
  getCompetencies: async (classId: string) => {
    const res = await apiService.get(`/analytics/classes/${classId}/competencies`);
    return res.data;
  },
  generateRecommendations: async (classId: string) => {
    const res = await apiService.post(`/analytics/recommendations/generate?class_id=${classId}`);
    return res.data;
  }
};
