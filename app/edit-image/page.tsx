'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Sparkles, Download, Share2, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MouseParticles from '@/component/MouseParticles';

/**
 * 编辑图片页面组件 - 支持异步任务处理
 * 提供图片上传、编辑和生成的功能界面
 */
const EditImagePage = () => {

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<'edit' | 'create'>('edit'); // 当前选中的标签页（编辑或创建）
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // 已上传的图片URL列表
  const [prompt, setPrompt] = useState(''); // 用户输入的描述文本
  const [isGenerating, setIsGenerating] = useState(false); // 是否正在生成图片
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // 生成的图片URL
  const [userId, setUserId] = useState<string>(''); // 用户ID
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null); // 当前任务ID
  const [taskProgress, setTaskProgress] = useState<number>(0); // 任务进度
  const [taskMessage, setTaskMessage] = useState<string>(''); // 任务状态消息
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number>(0); // 预估剩余时间
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 已经过时间
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null); // 任务开始时间
  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(new Set()); // 正在上传的图片URL
  const [isUsingWebhook, setIsUsingWebhook] = useState<boolean>(false); // 是否正在使用webhook
  const [webhookTimeout, setWebhookTimeout] = useState<NodeJS.Timeout | null>(null); // webhook超时定时器
  const fileInputRef = useRef<HTMLInputElement>(null); // 文件输入框的引用


  // 生成或获取用户ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('temp_user_id');
    if (!storedUserId) {
      // 生成临时用户ID（UUID格式）
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('temp_user_id', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // 正向计时器 - 显示已等待时间
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating && taskStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - taskStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating, taskStartTime]);


  // 清理webhook和定时器
  useEffect(() => {
    return () => {
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
      }
    };
  }, [webhookTimeout]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) {
      if (!userId) {
        alert('Initializing user information, please try again later');
      }
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 改为10MB限制，与API一致
        alert('Image size cannot exceed 10MB');
        continue;
      }

      if (uploadedImages.length + i >= 5) {
        alert('Maximum 5 images allowed');
        break;
      }

      // 生成临时ID用于跟踪上传状态
      const tempId = `temp_${Date.now()}_${i}`;

      // 立即显示loading状态
      setUploadingSlots(prev => new Set([...prev, tempId]));

      // 上传到Cloudflare R2
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId); // 添加userId参数
        formData.append('type', 'image'); // 添加文件类型参数

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const imageUrl = result.data.url;

            // 上传成功后，添加图片URL，并将loading状态转移到真实URL
            setUploadedImages(prev => [...prev, imageUrl].slice(0, 5));
            setUploadingSlots(prev => {
              const newSet = new Set(prev);
              newSet.delete(tempId);
              newSet.add(imageUrl);
              return newSet;
            });
            console.log('Upload successful:', imageUrl);

            // 预加载图片，等图片加载完成后再移除loading
            const img = new window.Image();
            img.onload = () => {
              // 图片加载完成，移除loading状态
              setUploadingSlots(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageUrl);
                return newSet;
              });
            };
            img.onerror = () => {
              // 图片加载失败，也移除loading状态
              setUploadingSlots(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageUrl);
                return newSet;
              });
              console.error('Image load failed');
            };
            img.src = imageUrl;
          } else {
            console.error('Upload failed:', result.error || 'Unknown error');
            alert(`Upload failed: ${result.error || 'Unknown error'}`);
            // 移除loading状态
            setUploadingSlots(prev => {
              const newSet = new Set(prev);
              newSet.delete(tempId);
              return newSet;
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          alert(`Upload failed: ${errorText}`);
          // 移除loading状态
          setUploadingSlots(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempId);
            return newSet;
          });
        }
      } catch (error) {
        // 移除loading状态
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });

        console.error('Upload error:', error);
        alert(`Upload error: ${error instanceof Error ? error.message : 'Network error'}`);
      }
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { taskProgress: progress, task } = result.data;

          setTaskProgress(progress.progress || 0);
          setTaskMessage(progress.message || '');
          setEstimatedTimeLeft(progress.estimatedTimeLeft || 0);

          if (progress.status === 'completed' && task.output_image_url) {
            // 任务完成
            setGeneratedImage(task.output_image_url);
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskProgress(100);
            setTaskMessage('Task completed!');
            setTaskStartTime(null);
            console.log('图像生成完成:', task.output_image_url);
            return false; // 停止轮询
          } else if (progress.status === 'failed') {
            // 任务失败
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskStartTime(null);
            alert(`Task failed: ${progress.message}`);
            return false; // 停止轮询
          }

          return true; // 继续轮询
        }
      }
    } catch (error) {
      console.error('查询任务状态失败:', error);
    }
    return true; // 遇到错误时继续轮询
  };

  // 开始轮询任务状态
  const startTaskPolling = (taskId: string) => {
    // 如果正在使用webhook，不启动轮询
    if (isUsingWebhook) {
      console.log('正在使用webhook，跳过轮询');
      return;
    }

    console.log('开始轮询模式');
    setCurrentTaskId(taskId);
    if (taskProgress === 0) {
      setTaskProgress(10);
      setTaskMessage('Task created, processing...');
    }

    const pollInterval = setInterval(async () => {
      // 如果切换到webhook模式，停止轮询
      if (isUsingWebhook) {
        clearInterval(pollInterval);
        return;
      }

      const shouldContinue = await pollTaskStatus(taskId);
      if (!shouldContinue) {
        clearInterval(pollInterval);
      }
    }, 2000); // 每2秒轮询一次

    // 5分钟后自动停止轮询
    setTimeout(() => {
      clearInterval(pollInterval);
      if (currentTaskId === taskId && !isUsingWebhook) {
        setIsGenerating(false);
        setCurrentTaskId(null);
        setTaskStartTime(null);
        alert('Task processing timeout, please check manually later');
      }
    }, 300000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !userId) {
      if (!userId) {
        alert('正在初始化用户信息，请稍后重试');
      }
      return;
    }

    const startTime = Date.now();
    setIsGenerating(true);
    setGeneratedImage(null);
    setTaskProgress(0);
    setTaskMessage('');
    setElapsedTime(0);
    setTaskStartTime(startTime);

    try {
      const isEditMode = selectedTab === 'edit' && uploadedImages.length > 0;

      const requestBody = {
        prompt: prompt.trim(),
        userId: userId,
        // 如果是编辑模式且有上传的图片，传入第一张图片
        inputImage: isEditMode ? uploadedImages[0] : undefined,
        // 生成参数
        width: 512,
        height: 512,
        steps: 20,
        guidance_scale: 7.5,
        strength: 0.8, // 编辑强度
      };

      const apiEndpoint = isEditMode ? '/api/ai/edit' : '/api/ai/generate';

      console.log('创建异步任务:', apiEndpoint, {
        ...requestBody,
        inputImage: requestBody.inputImage ? '[IMAGE_URL]' : undefined
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.taskId) {
          console.log('任务创建成功:', result.data.taskId);
          setCurrentTaskId(result.data.taskId);
          setTaskProgress(10);
          setTaskMessage('Task created, processing...');

          // 先尝试使用webhook，15秒后自动切换到轮询
          setupWebhookListener(result.data.taskId);
        } else {
          console.error('任务创建失败:', result.error || '未知错误');
          alert(`Task creation failed: ${result.error || 'Unknown error'}`);
          setIsGenerating(false);
          setTaskStartTime(null);
        }
      } else {
        const errorText = await response.text();
        console.error('任务创建失败:', errorText);
        alert(`Task creation failed: ${errorText}`);
        setIsGenerating(false);
        setTaskStartTime(null);
      }
    } catch (error) {
      console.error('任务创建失败:', error);
      alert(`Task creation failed: ${error instanceof Error ? error.message : 'Network error'}`);
      setIsGenerating(false);
      setTaskStartTime(null);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDownload = async () => {
    if (!generatedImage) {
      alert('No image available for download, please generate an image first');
      return;
    }

    try {
      // 使用代理API下载图片，避免CORS问题
      const response = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: generatedImage,
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('下载请求失败');
      }

      // 获取图片数据
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 生成文件名，包含时间戳
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `ai-generated-image-${timestamp}.jpg`;

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('图片下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      alert('Download failed, please try again later');
    }
  };

  // 设置webhook监听
  const setupWebhookListener = (taskId: string) => {
    setIsUsingWebhook(true);

    // 创建EventSource连接
    const eventSource = new EventSource(`/api/tasks/${taskId}/webhook?userId=${userId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.taskProgress) {
          const { taskProgress: progress, task } = data;

          setTaskProgress(progress.progress || 0);
          setTaskMessage(progress.message || '');
          setEstimatedTimeLeft(progress.estimatedTimeLeft || 0);

          if (progress.status === 'completed' && task.output_image_url) {
            // 任务完成
            setGeneratedImage(task.output_image_url);
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskProgress(100);
            setTaskMessage('Task completed!');
            setTaskStartTime(null);
            setIsUsingWebhook(false);
            eventSource.close();
            console.log('图像生成完成:', task.output_image_url);
          } else if (progress.status === 'failed') {
            // 任务失败
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskStartTime(null);
            setIsUsingWebhook(false);
            eventSource.close();
            alert(`Task failed: ${progress.message}`);
          }
        }
      } catch (error) {
        console.error('解析webhook数据失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Webhook连接错误:', error);
      eventSource.close();
      setIsUsingWebhook(false);
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
      }
      // 如果webhook失败，立即切换到轮询
      startTaskPolling(taskId);
    };

    // 15秒后自动切换到轮询
    const timeout = setTimeout(() => {
      console.log('15秒已过，切换到轮询模式');
      eventSource.close();
      setIsUsingWebhook(false);
      setWebhookTimeout(null);
      startTaskPolling(taskId);
    }, 15000);

    setWebhookTimeout(timeout);

    return eventSource;
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* 鼠标粒子效果 */}
      <MouseParticles />

      {/* 顶部导航 */}
      <div className="border-b border-white/10 backdrop-blur-md" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between ">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:scale-105 transition-all duration-200 -ml-4"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="text-white text-2xl font-bold">AI Art Studio</span>
            </Link>

            <div className="flex items-center gap-4 -mr-8">
              <button className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/5 transition-colors group flex items-center justify-center cursor-pointer">
                <Share2 className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedImage}
                className={`w-10 h-10 rounded-full border transition-colors group flex items-center justify-center cursor-pointer ${
                  generatedImage
                    ? 'border-white/20 hover:bg-white/5'
                    : 'border-white/10 cursor-not-allowed opacity-50'
                }`}
                title={generatedImage ? 'Download generated image' : 'Please generate an image first'}
              >
                <Download className={`w-4 h-4 transition-colors ${
                  generatedImage
                    ? 'group-hover:text-blue-400'
                    : 'text-white/30'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-4/5 max-w-10xl mx-auto px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* 左侧控制面板 */}
          <div className="space-y-6 p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md">
            {/* 标签页 */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSelectedTab('edit')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 cursor-pointer ${
                  selectedTab === 'edit'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Edit Image
              </button>
              <button
                onClick={() => setSelectedTab('create')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 cursor-pointer ${
                  selectedTab === 'create'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Create Image
              </button>
            </div>

            {/* 参考图片上传区域 - 在Create模式下隐藏 */}
            {selectedTab === 'edit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reference Images (up to 5)</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* 显示已上传的图片 */}
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-white/20">
                      <Image
                        src={image}
                        alt={`Reference ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      {/* 如果图片正在加载，显示loading遮罩 */}
                      {uploadingSlots.has(image) && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <div className="text-xs text-blue-400">Loading...</div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* 显示正在上传但还没有URL的loading状态 */}
                {Array.from(uploadingSlots).filter(id => id.startsWith('temp_')).map((tempId) => (
                  <div key={`loading-${tempId}`} className="relative group">
                    <div className="aspect-square rounded-lg border-2 border-dashed border-blue-400/50 flex flex-col items-center justify-center bg-blue-500/10">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <div className="text-xs text-blue-400">Uploading...</div>
                    </div>
                  </div>
                ))}

                {/* 显示添加按钮（如果还有空位且没有正在上传） */}
                {(uploadedImages.length + Array.from(uploadingSlots).filter(id => id.startsWith('temp_')).length) < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors group"
                  >
                    <div className="text-4xl text-white/40 group-hover:text-blue-400 transition-colors">+</div>
                    <div className="text-sm text-white/60 mt-2">Add Image</div>
                    <div className="text-xs text-white/40">Max 10MB</div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            )}

            {/* 描述输入区域 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold">What changes would you like to make?</label>
                <button
                  onClick={copyPrompt}
                  className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. Change the background to a sunset beach scene."
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-white/40">
                  {prompt.length}/5000 characters
                </div>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-500/50 disabled:to-purple-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? 'Processing...' : 'Generate Now'}
            </button>

            {/* 任务进度显示 */}
            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{taskMessage}</span>
                  {estimatedTimeLeft > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {estimatedTimeLeft}s
                    </span>
                  )}
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskProgress}%` }}
                  ></div>
                </div>
                {currentTaskId && (
                  <div className="text-xs text-white/50">
                    Task ID: {currentTaskId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧显示区域 */}
          <div className="space-y-4">
            {/* 生成框 */}
            <div className="relative p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md">
              <div className="h-[32rem] border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center overflow-hidden">
                {generatedImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={generatedImage}
                      alt="Generated image"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                ) : isGenerating ? (
                  <div className="text-center relative">
                    {/* 中心loading图标 */}
                    <div className="w-28 h-28 mx-auto relative">
                      {/* 外圈装饰环 */}
                      <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                      <div className="absolute inset-1 border-2 border-white/10 rounded-full"></div>

                      {/* 旋转的渐变环 */}
                      <div className="absolute inset-0 rounded-full animate-spin-slow">
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 blur-sm"></div>
                      </div>
                      <div className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 rounded-full animate-spin"></div>

                      {/* 内部图标 */}
                      <div className="absolute inset-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25">
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-white/60 text-lg">Your masterpiece will be displayed here</p>
                  </div>
                )}
              </div>
            </div>

            {/* 生成时长提示 - 生成框下方 */}
            {isGenerating && (
              <div className="text-center py-3">
                <p className="text-white/60 text-sm">
                  ⏱️ Estimated generation time: 20-30 seconds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditImagePage;