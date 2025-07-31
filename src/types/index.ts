export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export interface DatabaseRecord {
  id: number;
  created_at: Date;
  updated_at: Date;
}

export interface User extends DatabaseRecord {
  uuid: string;
  email: string;
  password: string;
  name: string;
  role_id: number;
  status: 'active' | 'inactive' | 'suspended';
  email_verified_at: Date | null;
  last_login_at: Date | null;
  deleted_at: Date | null;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role_id: number;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
  email_verified_at?: Date | null;
  last_login_at?: Date | null;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface Post extends DatabaseRecord {
  title: string;
  content: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  author_id: number;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
}

// Export user registration types
export * from './userRegistration';

// Export email verification types
export * from './emailVerification';

// Export audit logging types
export * from './audit';

// Export role management types
export * from './roleManagement';
