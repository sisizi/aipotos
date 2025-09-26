/**
 * 数据库相关类型定义
 */
export interface DatabaseTaskRecord {
  id: string;
  user_id: string;
  task_type: 'generate' | 'edit' | 'enhance';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_image_url?: string;
  input_prompt: string;
  input_params?: Record<string, unknown>;
  output_image_url?: string;
  nano_banana_task_id?: string;
  processing_time?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export type TaskRow = DatabaseTaskRecord;
export type TaskInsert = Omit<DatabaseTaskRecord, 'id' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<Omit<DatabaseTaskRecord, 'id' | 'created_at' | 'updated_at'>>;

// 数据库响应类型
export interface DatabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
  count?: number;
}

// User related types
export interface DatabaseUserRecord {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRow = DatabaseUserRecord;
export type UserInsert = Omit<DatabaseUserRecord, 'id' | 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<Omit<DatabaseUserRecord, 'id' | 'created_at' | 'updated_at'>>;

