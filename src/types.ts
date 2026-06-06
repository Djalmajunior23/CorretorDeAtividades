export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}
