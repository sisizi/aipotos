/**
 * AI图像生成项目类型定义
 */

export interface TaskRecord {
  id: string;
  user_id: string;
  task_type: 'generate' | 'edit' | 'enhance';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_image_url?: string;
  input_prompt: string;
  input_params?: Record<string, unknown>;
  output_image_url?: string;
  output_image_urls?: string[];  // 支持多张输出图片
  nano_banana_task_id?: string;
  processing_time?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  style?: string;
  user_id?: string;
}

export interface EditImageRequest {
  image: File;
  prompt: string;
  mask?: File;
  strength?: number;
  user_id?: string;
}

// 新的Nano Banana API类型定义（基于官方文档）

// 创建任务请求类型
export interface NanoBananaCreateTaskRequest {
  model: 'google/nano-banana' | 'google/nano-banana-edit';  // 支持基础模型和编辑模型
  input: {
    prompt: string;
    // 编辑时提供图片，生成时不提供图片
    image_urls?: string[];  // 最多5张图片（编辑时提供，生成时不提供）
    image_size?: 'auto' | '1:1' | '3:4' | '9:16' | '4:3' | '16:9';
    strength?: number;      // 编辑强度（仅编辑时使用）
    output_format?: 'png' | 'jpeg';
  };
  callBackUrl?: string;
}

// 任务状态类型


// 旧的响应类型（保持向后兼容）
export interface NanoBananaResponse {
  success: boolean;
  task_id: string;
  image_url: string;
  message?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 数据库相关类型
export type TaskInsert = Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>>;

// 图像生成参数类型
export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  style?: 'realistic' | 'cartoon' | 'anime' | 'oil_painting' | 'watercolor' | 'default';
}

// 图像编辑参数类型
export interface ImageEditParams {
  image_url: string;
  prompt: string;
  mask_url?: string;
  strength?: number;
}

// 文件上传类型
export interface FileUploadResponse {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

// 任务状态统计类型
export interface TaskStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}


// API任务创建响应
export interface TaskCreationResponse {
  success: boolean;
  taskId: string;
  message?: string;
  estimatedTime?: number;  // 预估处理时间（秒）
}

// 任务进度信息
export interface TaskProgress {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;       // 进度百分比（0-100）
  message?: string;
  processingTime?: number; // 已处理时间（秒）
  estimatedTimeLeft?: number; // 预估剩余时间（秒）
}

// 用户类型（如果需要）
export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

// 组件Props类型
export interface AIImageGeneratorProps {
  userId?: string;
  onImageGenerated?: (imageUrl: string, taskId: string) => void;
  onError?: (error: string) => void;
}

// Hook返回类型（更新为支持异步任务）
export interface UseAIImageReturn {
  generateImage: (params: ImageGenerationParams) => Promise<APIResponse>;
  editImage: (params: ImageEditParams) => Promise<APIResponse>;
  createGenerateTask: (params: ImageGenerationParams) => Promise<string>;  // 返回taskId
  createEditTask: (params: ImageEditParams) => Promise<string>;  // 返回taskId
  getTask: (taskId: string) => Promise<TaskRecord | null>;
  getUserTasks: (userId: string, limit?: number, offset?: number) => Promise<TaskRecord[]>;
  isLoading: boolean;
  error: string | null;
  currentTask: TaskRecord | null;
}

// 表单数据类型
export interface GenerateFormData {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
  seed?: number;
  style: string;
}

export interface EditFormData {
  image: FileList;
  prompt: string;
  mask?: FileList;
  strength: number;
}

// 错误类型
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}