export type User = {
  id: number;
  email: string;
  username: string;
  avatar?: string | null;
  provider?: 'google' | 'github' | 'local';
  createdAt: string;
};