import apiService from './apiService';

export const getStudentDashboard = async (studentId: number) => {
    const res = await apiService.get(`/student/dashboard?student_id=${studentId}`);
    return res.data;
};

export const getStudentAttempts = async (studentId: number) => {
    const res = await apiService.get(`/student/attempts?student_id=${studentId}`);
    return res.data;
};

export const getStudentProgress = async (studentId: number) => {
    const res = await apiService.get(`/student/progress?student_id=${studentId}`);
    return res.data;
};
