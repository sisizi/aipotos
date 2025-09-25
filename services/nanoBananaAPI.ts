/**
 * Nano Banana AI API服务 - 异步任务处理版本
 */

import {
  GenerateImageRequest,
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
    // 按优先级获取webhook基础URL
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL;

    console.log('Webhook URL detection:', {
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL || 'not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      selected: webhookBaseUrl || 'none'
    });

    if (!webhookBaseUrl) {
      const fallbackUrl = 'http://localhost:3000/api/webhook/nano-banana';
      console.warn('⚠️  No webhook base URL configured! Using fallback:', fallbackUrl);
      console.warn('⚠️  kei.ai won\'t be able to send webhooks to localhost unless using tunnel (ngrok, etc.)');
      return fallbackUrl;
    }

    // 确保 URL以https://或http://开头
    let baseUrl = webhookBaseUrl;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
      console.log('Added https:// prefix to URL');
    }

    const fullWebhookUrl = `${baseUrl}/api/webhook/nano-banana`;

    // 检测是否使用localhost（需要隧道）
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      console.warn('🔧 Using localhost webhook URL. Make sure you have a tunnel (ngrok, localtunnel, etc.) running for kei.ai to reach your webhook!');
    } else {
      console.log('✅ Webhook URL configured for external access:', fullWebhookUrl);
    }

    return fullWebhookUrl;
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
        },
        callBackUrl: data.callBackUrl
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
   * 创建图片生成任务（使用Nano Banana模型进行文生图）
   * @param params 生成参数
   * @returns 任务ID
   */
  async createGenerateTask(params: Omit<GenerateImageRequest, 'user_id'>): Promise<string> {
    // 使用基础的 nano-banana 模型进行文本生成图片
    const requestData: NanoBananaCreateTaskRequest = {
      model: 'google/nano-banana',  // 使用基础模型进行文本到图片生成
      input: {
        prompt: params.prompt,
        output_format: 'png',
        image_size: this.mapImageSize(params.width, params.height),
      },
      // 配置webhook回调URL
      callBackUrl: this.getWebhookUrl()
    };

    console.log('Creating image generation task (text-to-image using nano-banana base model):', {
      model: requestData.model,
      prompt: params.prompt.substring(0, 100) + '...',
      image_size: requestData.input.image_size,
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
   * 创建图片编辑任务（使用专门的编辑模型）
   * @param params 编辑参数
   * @returns 任务ID
   */
  async createEditTask(params: {
    image_url?: string; // 兼容单图
    image_urls?: string[]; // 支持多图
    prompt: string;
    mask_url?: string;
    strength?: number;
  }): Promise<string> {
    // 支持单图或多图输入
    const imageUrls = params.image_urls || (params.image_url ? [params.image_url] : []);

    if (imageUrls.length === 0) {
      throw new AIServiceError('At least one image URL is required for editing', 'MISSING_IMAGE');
    }

    const requestData: NanoBananaCreateTaskRequest = {
      model: 'google/nano-banana-edit',  // 专门的图片编辑模型
      input: {
        prompt: params.prompt,
        image_urls: imageUrls,
        output_format: 'png',
        image_size: 'auto', // 保持原始尺寸
        strength: params.strength || 0.8,
      },
      // 配置webhook回调URL
      callBackUrl: this.getWebhookUrl()
    };

    console.log('Creating image editing task with params:', {
      model: requestData.model,
      prompt: params.prompt.substring(0, 100) + '...',
      imageCount: imageUrls.length,
      imageUrls: imageUrls.map(url => url.substring(0, 50) + '...'),
      strength: params.strength || 0.8
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
    // 支持两种模型：基础生成模型和编辑专用模型
    return [
      'google/nano-banana',       // 文本生成图片（Text-to-Image）
      'google/nano-banana-edit'   // 图片编辑（Image-to-Image）
    ];
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