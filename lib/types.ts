/**
 * 数据库相关类型定义
 */

import { DefaultSession } from 'next-auth'

// 如果您使用Supabase生成的类型，可以这样导入：
// import { Database } from './database.types';
// export type TaskRow = Database['public']['Tables']['tasks']['Row'];
// export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
// export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// 暂时使用手动定义的类型，您可以后续替换为Supabase生成的类型
export interface DatabaseTaskRecord {
  id: string;
  user_id: string;
  task_type: 'generate' | 'edit' | 'enhance';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_image_url?: string;
  input_prompt: string;
  input_params?: Record<string, any>;
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
    details?: any;
  } | null;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
  count?: number;
}

// User related types
export interface DatabaseUserRecord {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  credits: number;
  user_level: 'free' | 'pro' | 'premium';
  provider: string;
  created_at: string;
  updated_at: string;
}

export type UserRow = DatabaseUserRecord;
export type UserInsert = Omit<DatabaseUserRecord, 'id' | 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<Omit<DatabaseUserRecord, 'id' | 'created_at' | 'updated_at'>>;

// Extended Session type for Next-Auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    sub?: string;
  }
}