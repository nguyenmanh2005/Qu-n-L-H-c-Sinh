// src/types/index.ts

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: 'Student' | 'Teacher' | 'Admin';
}

export interface AssignmentDto {
  id: number;
  title: string;
  description?: string;
  classId: number;
  className: string;
  teacherId: string;
  teacherName?: string;
  openAt: string;
  dueAt: string;
  createdAt: string;
  isOpen: boolean;
  isExpired: boolean;
  submissionCount: number;
}

export interface SubmissionDto {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  isGraded: boolean;
}

export interface MySubmissionDto {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  className: string;
  dueAt: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  canEdit: boolean;
}
