/**
 * Nano Banana AI API服务 - 异步任务处理版本
 */

import {
  GenerateImageRequest,
  NanoBananaTaskResponse,
  NanoBananaTaskStatus,
  NanoBananaCreateTaskRequest,
  AIServiceError
} from '@/types';

export class NanoBananaAPIService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.NANO_BANANA_BASE_URL || 'https://api.kie.ai/api/v1/jobs';
    this.apiKey = process.env.NANO_BANANA_API_KEY || '';

    if (!this.apiKey) {
      throw new AIServiceError(
        'Nano Banana API key is required',
        'MISSING_API_KEY'
      );
    }

    console.log('Nano Banana API initialized:', {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length
    });
  }

  /**
   * 获取webhook回调URL
   */
  private getWebhookUrl(): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/webhook/nano-banana`;
  }

  /**
   * 获取指定尺寸的白色画布URL
   * @param width 宽度
   * @param height 高度
   * @returns 白色画布图片URL
   */
  private getBlankCanvasUrl(width: number, height: number): string {
    // 使用一个简单的白色画布图片URL
    // 这是一个1x1白色像素的base64编码，然后我们让服务处理
    const size = Math.min(width, height, 1024); // 限制尺寸避免问题
    return `https://dummyimage.com/${size}x${size}/ffffff/ffffff.png`;
  }

  /**
   * 创建任务的通用请求方法
   */
  private async makeCreateTaskRequest(data: NanoBananaCreateTaskRequest): Promise<{ taskId: string }> {
    const url = `${this.baseURL}/createTask`;

    try {
      console.log(`Creating task at Nano Banana API: ${url}`);
      console.log('Request data:', {
        model: data.model,
        input: {
          ...data.input,
          prompt: data.input.prompt.substring(0, 100) + '...',
          image_urls: data.input.image_urls ? `[${data.input.image_urls.length} images]` : undefined
        }
      });

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PhotoGen-AI/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log(`Nano Banana API response status: ${response.status}`);

      if (!response.ok) {
        console.error(`Nano Banana API error response: ${responseText}`);
        throw new AIServiceError(
          `Nano Banana API error (${response.status}): ${responseText}`,
          `HTTP_${response.status}`,
          { requestData: data, responseText }
        );
      }

      try {
        const result = JSON.parse(responseText);

        // 检查API响应格式
        if (result.code !== 200) {
          throw new AIServiceError(
            `Task creation failed: ${result.msg}`,
            `API_ERROR_${result.code}`,
            result
          );
        }

        if (!result.data?.taskId) {
          throw new AIServiceError(
            'Invalid response: missing taskId',
            'INVALID_RESPONSE',
            result
          );
        }

        console.log(`Task created successfully: ${result.data.taskId}`);
        return { taskId: result.data.taskId };

      } catch (parseError) {
        console.error('Failed to parse Nano Banana API response as JSON:', parseError);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('Full response text that failed to parse:', responseText);
        console.error('Response text length:', responseText.length);
        console.error('Response text type:', typeof responseText);

        // Check if response is HTML (common when API is down)
        const isHTML = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');
        const isEmptyResponse = responseText.trim().length === 0;

        let errorMessage = 'Invalid JSON response from Nano Banana API';
        if (isHTML) {
          errorMessage = 'API service returned HTML instead of JSON (service may be down)';
        } else if (isEmptyResponse) {
          errorMessage = 'API service returned empty response';
        } else {
          errorMessage = `Invalid JSON response from Nano Banana API. Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
        }

        throw new AIServiceError(
          errorMessage,
          'INVALID_JSON',
          {
            responseText: responseText.substring(0, 500), // Limit stored response text
            responseStatus: response.status,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            isHTML,
            isEmptyResponse
          }
        );
      }

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      console.error('Nano Banana API request failed:', error);

      // Handle timeout/abort errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          'Request timeout: AI service is taking too long to respond',
          'REQUEST_TIMEOUT',
          { endpoint: url, error }
        );
      }

      throw new AIServiceError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        { endpoint: url, error }
      );
    }
  }

  /**
   * 查询任务状态的通用方法
   */
  private async getTaskInfo(taskId: string): Promise<NanoBananaTaskStatus> {
    const url = `${this.baseURL}/recordInfo?taskId=${taskId}`;

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for status checks

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'PhotoGen-AI/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AIServiceError(
          `Failed to get task status: ${response.status} ${response.statusText}`,
          'TASK_STATUS_ERROR',
          { taskId, status: response.status }
        );
      }

      const result = await response.json();

      if (result.code !== 200) {
        throw new AIServiceError(
          `Task query failed: ${result.msg}`,
          `API_ERROR_${result.code}`,
          result
        );
      }

      return result.data;

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Error getting task status:', error);

      // Handle timeout/abort errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          'Task status check timeout: AI service is taking too long to respond',
          'STATUS_CHECK_TIMEOUT',
          { taskId }
        );
      }

      throw new AIServiceError(
        `Task status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TASK_STATUS_FAILED',
        { taskId }
      );
    }
  }

  /**
   * 创建图片生成任务
   * @param params 生成参数
   * @returns 任务ID
   */
  async createGenerateTask(params: Omit<GenerateImageRequest, 'user_id'>): Promise<string> {
    // Nano Banana API是图片编辑API，需要一个基础图片
    // 对于"生成"任务，我们使用白色画布作为基础
    const baseImageUrl = this.getBlankCanvasUrl(params.width || 512, params.height || 512);

    const requestData: NanoBananaCreateTaskRequest = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: params.prompt,
        image_urls: [baseImageUrl],
        output_format: 'png',
        image_size: this.mapImageSize(params.width, params.height),
      },
      // 配置webhook回调URL
      callBackUrl: this.getWebhookUrl()
    };

    console.log('Creating image generation task with params:', {
      model: requestData.model,
      prompt: params.prompt.substring(0, 100) + '...',
      image_size: requestData.input.image_size,
      baseImageUrl: baseImageUrl,
      targetSize: `${params.width || 512}x${params.height || 512}`
    });

    try {
      const { taskId } = await this.makeCreateTaskRequest(requestData);
      return taskId;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        `Image generation task creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_TASK_ERROR',
        { params }
      );
    }
  }

  /**
   * 创建图片编辑任务
   * @param params 编辑参数
   * @returns 任务ID
   */
  async createEditTask(params: {
    image_url: string;
    prompt: string;
    mask_url?: string;
    strength?: number;
  }): Promise<string> {
    const requestData: NanoBananaCreateTaskRequest = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: params.prompt,
        image_urls: [params.image_url],
        output_format: 'png',
        image_size: 'auto', // 保持原始尺寸
      },
      // 配置webhook回调URL
      callBackUrl: this.getWebhookUrl()
    };

    console.log('Creating image editing task with params:', {
      model: requestData.model,
      prompt: params.prompt.substring(0, 100) + '...',
      hasInputImage: !!params.image_url
    });

    try {
      const { taskId } = await this.makeCreateTaskRequest(requestData);
      return taskId;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        `Image editing task creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EDITING_TASK_ERROR',
        { params }
      );
    }
  }

  /**
   * 查询任务状态
   * @param taskId Nano Banana任务ID
   * @returns 任务状态信息
   */
  async getTaskStatus(taskId: string): Promise<NanoBananaTaskStatus> {
    return this.getTaskInfo(taskId);
  }

  /**
   * 等待任务完成（轮询模式）
   * @param taskId 任务ID
   * @param options 轮询选项
   * @returns 任务结果
   */
  async waitForTaskCompletion(taskId: string, options: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
  } = {}): Promise<NanoBananaTaskResponse> {
    const {
      maxAttempts = 120,      // 最多轮询120次
      intervalMs = 2000,      // 每2秒轮询一次
      timeoutMs = 240000      // 最多等待4分钟
    } = options;

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      // 检查是否超时
      if (Date.now() - startTime > timeoutMs) {
        throw new AIServiceError(
          `Task timeout after ${timeoutMs}ms`,
          'TASK_TIMEOUT',
          { taskId, attempts, timeoutMs }
        );
      }

      try {
        const taskStatus = await this.getTaskStatus(taskId);
        attempts++;

        console.log(`Task ${taskId} status check ${attempts}/${maxAttempts}: ${taskStatus.state}`);

        if (taskStatus.state === 'success') {
          // 任务成功完成
          if (!taskStatus.resultJson) {
            throw new AIServiceError(
              'Task completed but no result found',
              'MISSING_RESULT',
              taskStatus
            );
          }

          let resultData;
          try {
            resultData = JSON.parse(taskStatus.resultJson);
          } catch (parseError) {
            throw new AIServiceError(
              'Failed to parse task result',
              'INVALID_RESULT_JSON',
              { taskStatus, parseError }
            );
          }

          return {
            success: true,
            taskId,
            imageUrls: resultData.resultUrls || [],
            message: '任务成功完成',
            processingTime: taskStatus.costTime,
            completedAt: new Date(taskStatus.completeTime || Date.now()).toISOString()
          };

        } else if (taskStatus.state === 'fail') {
          // 任务失败
          throw new AIServiceError(
            taskStatus.failMsg || 'Task failed',
            taskStatus.failCode || 'TASK_FAILED',
            taskStatus
          );

        } else if (taskStatus.state === 'waiting') {
          // 任务还在等待中，继续轮询
          if (attempts < maxAttempts) {
            console.log(`Task ${taskId} still waiting, checking again in ${intervalMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            continue;
          }
        } else {
          // 未知状态
          console.warn(`Unknown task state: ${taskStatus.state}`);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            continue;
          }
        }

      } catch (error) {
        if (error instanceof AIServiceError && error.code !== 'TASK_STATUS_FAILED') {
          throw error;
        }

        console.warn(`Failed to check task status (attempt ${attempts}):`, error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }
        throw error;
      }
    }

    throw new AIServiceError(
      `Task polling exceeded maximum attempts (${maxAttempts})`,
      'MAX_POLLING_ATTEMPTS',
      { taskId, maxAttempts, timeoutMs }
    );
  }

  /**
   * 生成图片（完整流程）
   * @param params 生成参数
   * @param options 轮询选项
   * @returns 生成结果
   */
  async generateImage(params: Omit<GenerateImageRequest, 'user_id'>, options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
  }): Promise<NanoBananaTaskResponse> {
    const taskId = await this.createGenerateTask(params);
    console.log(`Created generation task: ${taskId}, waiting for completion...`);
    return this.waitForTaskCompletion(taskId, options);
  }

  /**
   * 编辑图片（完整流程）
   * @param params 编辑参数
   * @param options 轮询选项
   * @returns 编辑结果
   */
  async editImage(params: {
    image_url: string;
    prompt: string;
    mask_url?: string;
    strength?: number;
  }, options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
  }): Promise<NanoBananaTaskResponse> {
    const taskId = await this.createEditTask(params);
    console.log(`Created editing task: ${taskId}, waiting for completion...`);
    return this.waitForTaskCompletion(taskId, options);
  }

  /**
   * 简单的连接测试
   * @returns 连接状态
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('Testing Nano Banana API connection...');
      const url = `${this.baseURL}/createTask`;

      // 测试最小的请求
      const testData = {
        model: 'google/nano-banana-edit',
        input: {
          prompt: 'simple test',
          image_urls: ['https://via.placeholder.com/512x512.png'], // 使用占位符图片URL
          output_format: 'png',
          image_size: 'auto'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PhotoGen-AI/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();

      console.log('Connection test response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        responseText: responseText.substring(0, 500)
      });

      return {
        success: response.ok,
        details: {
          status: response.status,
          responseText: responseText.substring(0, 200),
          headers: Object.fromEntries(response.headers.entries())
        }
      };

    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error }
      };
    }
  }

  /**
   * 检查API健康状态
   * @returns 是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.testConnection();
      return result.success;
    } catch (error) {
      console.error('Nano Banana API health check failed:', error);
      return false;
    }
  }

  /**
   * 获取可用的模型列表
   * @returns 模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    // 根据文档，目前只支持 google/nano-banana-edit 模型
    return ['google/nano-banana-edit'];
  }

  /**
   * 获取支持的图像尺寸
   * @returns 支持的尺寸列表
   */
  getSupportedSizes(): Array<{width: number, height: number, label: string, apiValue: string}> {
    return [
      { width: 512, height: 512, label: '自动尺寸', apiValue: 'auto' },
      { width: 512, height: 512, label: '正方形 (1:1)', apiValue: '1:1' },
      { width: 384, height: 512, label: '竖向 3:4', apiValue: '3:4' },
      { width: 288, height: 512, label: '竖向 9:16', apiValue: '9:16' },
      { width: 512, height: 384, label: '横向 4:3', apiValue: '4:3' },
      { width: 512, height: 288, label: '横向 16:9', apiValue: '16:9' },
    ];
  }

  /**
   * 映射图像尺寸到API参数
   * @param width 宽度
   * @param height 高度
   * @returns API尺寸参数
   */
  private mapImageSize(width?: number, height?: number): 'auto' | '1:1' | '3:4' | '9:16' | '4:3' | '16:9' {
    if (!width || !height) return 'auto';

    const ratio = width / height;

    if (Math.abs(ratio - 1) < 0.1) return '1:1';        // 正方形
    if (Math.abs(ratio - 0.75) < 0.1) return '3:4';     // 3:4 竖向
    if (Math.abs(ratio - 0.5625) < 0.1) return '9:16';  // 9:16 竖向
    if (Math.abs(ratio - 1.333) < 0.1) return '4:3';    // 4:3 横向
    if (Math.abs(ratio - 1.778) < 0.1) return '16:9';   // 16:9 横向

    return 'auto'; // 默认自动
  }

  /**
   * 验证生成参数
   * @param params 参数对象
   * @returns 验证结果
   */
  validateGenerationParams(params: Partial<GenerateImageRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.prompt || params.prompt.trim().length === 0) {
      errors.push('提示词不能为空');
    }

    if (params.prompt && params.prompt.length > 5000) {
      errors.push('提示词长度不能超过5000个字符');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证编辑参数
   * @param params 参数对象
   * @returns 验证结果
   */
  validateEditParams(params: { image_url?: string; prompt?: string }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.image_url || params.image_url.trim().length === 0) {
      errors.push('输入图片URL不能为空');
    }

    if (!params.prompt || params.prompt.trim().length === 0) {
      errors.push('提示词不能为空');
    }

    if (params.prompt && params.prompt.length > 5000) {
      errors.push('提示词长度不能超过5000个字符');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}