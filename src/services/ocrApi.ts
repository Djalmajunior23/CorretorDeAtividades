import apiService from './apiService';

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface OCRConfirmPayload {
  ocr_id: number;
  edited_text: string;
  language: string;
  test_cases: TestCase[];
}

export const ocrApi = {
  extractImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Let axios automatically set content-type for multipart with boundary
    const response = await apiService.post('/ocr/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  confirmOCR: async (payload: OCRConfirmPayload) => {
    const response = await apiService.post('/ocr/confirm', payload);
    return response.data;
  },

  getOCRHistory: async () => {
    const response = await apiService.get('/ocr/history');
    return response.data;
  }
};
