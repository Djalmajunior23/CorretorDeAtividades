import { apiUrl } from '../config/api';

export const getApiUrl = (path: string) => {
  return apiUrl(path);
};
