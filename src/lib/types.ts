export type UserRole = 'customer' | 'freelancer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  completedJobs?: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  skillsRequired: string[];
  customerId: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}