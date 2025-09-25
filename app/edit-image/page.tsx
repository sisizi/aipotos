'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Sparkles, Download, Share2, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 已经过时间
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null); // 任务开始时间
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set()); // 正在上传的slot索引
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

  // 计时器 - 显示已等待时间和超时提示
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating && taskStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - taskStartTime) / 1000);
        setElapsedTime(elapsed);

        // 10分钟后显示超时警告
        if (elapsed >= 600) { // 10分钟 = 600秒
          setTaskMessage('任务处理超时，正在自动标记为失败...');
        } else if (elapsed >= 480) { // 8分钟后开始警告
          const remaining = 600 - elapsed;
          setTaskMessage(`任务将在 ${remaining} 秒后超时，请耐心等待...`);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating, taskStartTime]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) {
      if (!userId) {
        alert('正在初始化用户信息，请稍后重试');
      }
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 改为10MB限制，与API一致
        alert('图片大小不能超过10MB');
        continue;
      }

      if (uploadedImages.length + i >= 5) {
        alert('最多只能上传5张图片');
        break;
      }

      // 计算当前上传slot的索引
      const currentSlotIndex = uploadedImages.length + i;

      // 2秒后显示loading状态
      const loadingTimeout = setTimeout(() => {
        setUploadingSlots(prev => new Set([...prev, currentSlotIndex]));
      }, 2000);

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

        // 清除loading timeout
        clearTimeout(loadingTimeout);

        // 移除loading状态
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSlotIndex);
          return newSet;
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUploadedImages(prev => [...prev, result.data.url].slice(0, 5));
            console.log('上传成功:', result.data.url);
          } else {
            console.error('上传失败:', result.error || '未知错误');
            alert(`上传失败: ${result.error || '未知错误'}`);
          }
        } else {
          const errorText = await response.text();
          console.error('上传失败:', errorText);
          alert(`上传失败: ${errorText}`);
        }
      } catch (error) {
        // 清除loading timeout和状态
        clearTimeout(loadingTimeout);
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSlotIndex);
          return newSet;
        });

        console.error('上传错误:', error);
        alert(`上传错误: ${error instanceof Error ? error.message : '网络错误'}`);
      }
    }
  };



  // 修复后的轮询检查函数
  const startSimplePolling = (taskId: string) => {
    setCurrentTaskId(taskId);
    setTaskProgress(10);
    setTaskMessage('任务已创建，正在处理中...');

    let checkCount = 0;
    const maxChecks = 120; // 10分钟
    let isPollingActive = true;

    const checkTask = async () => {
      if (!isPollingActive) return;

      checkCount++;

      try {
        // 首先尝试从缓存获取快速结果（静默处理404）
        try {
          const cacheResponse = await fetch(`/api/tasks/${taskId}/quick`);

          if (cacheResponse.ok) {
            const cacheResult = await cacheResponse.json();
            if (cacheResult.success && cacheResult.data) {
              const task = cacheResult.data;

              if (task.status === 'completed' && task.output_image_url) {
                console.log('✅ 缓存中找到完成的任务，立即显示图片:', task.output_image_url);

                // 停止轮询
                isPollingActive = false;

                // 更新UI状态
                setGeneratedImage(task.output_image_url);
                setIsGenerating(false);
                setCurrentTaskId(null);
                setTaskProgress(100);
                setTaskMessage('任务完成！');
                setTaskStartTime(null);
                return;
              } else if (task.status === 'failed') {
                isPollingActive = false;
                setIsGenerating(false);
                setCurrentTaskId(null);
                setTaskStartTime(null);
                setTaskProgress(0);
                setTaskMessage('');
                alert(`任务失败: ${task.error_message || '未知错误'}`);
                return;
              }
            }
          }
        } catch (cacheError) {
          // 静默处理缓存请求错误（404等），这是正常情况
        }

        // 如果缓存没有结果，检查数据库
        const taskResponse = await fetch(`/api/tasks/${taskId}?userId=${userId}`);

        if (taskResponse.ok) {
          const taskResult = await taskResponse.json();

          if (taskResult.success && taskResult.data) {
            const task = taskResult.data;

            if (task.status === 'completed' && task.output_image_url) {
              // 停止轮询
              isPollingActive = false;

              // 更新UI状态
              setGeneratedImage(task.output_image_url);
              setIsGenerating(false);
              setCurrentTaskId(null);
              setTaskProgress(100);
              setTaskMessage('任务完成！');
              setTaskStartTime(null);
              return;

            } else if (task.status === 'failed') {
              isPollingActive = false;
              setIsGenerating(false);
              setCurrentTaskId(null);
              setTaskStartTime(null);
              setTaskProgress(0);
              setTaskMessage('');
              alert(`任务失败: ${task.error_message || '未知错误'}`);
              return;
            }
            // 如果状态是 'processing' 或其他，继续轮询
          }
        }

        // 继续下一次检查
        if (checkCount < maxChecks && isPollingActive) {
          setTimeout(checkTask, 3000); // 3秒间隔
        } else if (checkCount >= maxChecks) {
          // 超时处理
          isPollingActive = false;
          setIsGenerating(false);
          setCurrentTaskId(null);
          setTaskStartTime(null);
          setTaskProgress(0);
          setTaskMessage('');
          alert('任务超时（10分钟），请稍后重试');
        }

      } catch (error) {
        // 网络错误也继续尝试
        if (checkCount < maxChecks && isPollingActive) {
          setTimeout(checkTask, 2000);
        }
      }
    };

    // 22秒后开始第一次检查
    setTimeout(checkTask, 25000);
  };


  // 简单轮询已替代复杂的SSE和备用检查机制

  // 查询任务最终状态
  const checkFinalTaskStatus = async (taskId: string) => {
    try {
      console.log(`🔍 检查任务状态: ${taskId}`);

      // 1. 优先检查快速缓存
      const quickResponse = await fetch(`/api/tasks/${taskId}/quick`);
      console.log(`📦 缓存检查响应状态: ${quickResponse.status}`);

      if (quickResponse.ok) {
        const quickResult = await quickResponse.json();
        console.log('📦 缓存检查结果:', quickResult);

        if (quickResult.success && quickResult.data) {
          const task = quickResult.data;
          if (task.status === 'completed' && task.output_image_url) {
            console.log('从缓存获取到图像结果:', task.output_image_url);
            setGeneratedImage(task.output_image_url);
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskProgress(100);
            setTaskMessage(task.is_temporary ? '任务完成！图像正在后台保存...' : '任务完成！');
            setTaskStartTime(null);
            return; // 找到结果，直接返回
          } else if (task.status === 'failed') {
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskStartTime(null);
            alert(`任务失败: ${task.error_message || '未知错误'}`);
            return;
          }
        }
      }

      // 2. 缓存中没有结果，检查数据库
      console.log('🗄️ 缓存中没有找到结果，检查数据库...');
      const taskResponse = await fetch(`/api/tasks/${taskId}?userId=${userId}`);
      console.log(`🗄️ 数据库检查响应状态: ${taskResponse.status}`);

      if (taskResponse.ok) {
        const taskResult = await taskResponse.json();
        console.log('🗄️ 数据库检查结果:', taskResult);

        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          if (task.status === 'completed' && task.output_image_url) {
            setGeneratedImage(task.output_image_url);
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskProgress(100);
            setTaskMessage('任务完成！');
            setTaskStartTime(null);
            console.log('从数据库获取到图像结果:', task.output_image_url);
          } else if (task.status === 'failed') {
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskStartTime(null);
            const errorMsg = task.error_message || '未知错误';
            if (errorMsg.includes('timed out')) {
              alert('任务超时（10分钟），AI服务没有及时响应，请稍后重试');
            } else {
              alert(`任务失败: ${errorMsg}`);
            }
          } else {
            // 任务仍在进行中（但SSE连接已断开）
            setIsGenerating(false);
            setCurrentTaskId(null);
            setTaskStartTime(null);
            alert('任务仍在处理中，但网络连接中断。请稍后刷新页面查看结果。');
          }
        }
      }
    } catch (error) {
      console.error('查询任务状态失败:', error);
      setIsGenerating(false);
      setCurrentTaskId(null);
      setTaskStartTime(null);
      alert('网络错误，无法检查任务状态。请稍后刷新页面重试。');
    }
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

    // 保留输入文本和上传的图片

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
          // 启动简化轮询检查数据库
          startSimplePolling(result.data.taskId);
        } else {
          console.error('任务创建失败:', result.error || '未知错误');
          alert(`任务创建失败: ${result.error || '未知错误'}`);
          setIsGenerating(false);
          setTaskStartTime(null);
        }
      } else {
        const errorText = await response.text();
        console.error('任务创建失败:', errorText);
        alert(`任务创建失败: ${errorText}`);
        setIsGenerating(false);
        setTaskStartTime(null);
      }
    } catch (error) {
      console.error('任务创建失败:', error);
      alert(`任务创建失败: ${error instanceof Error ? error.message : '网络错误'}`);
      setIsGenerating(false);
      setTaskStartTime(null);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  // 下载生成的图片
  const downloadGeneratedImage = async () => {
    if (!generatedImage) {
      alert('没有可下载的图片');
      return;
    }

    try {
      const filename = `ai-generated-image-${Date.now()}.png`;

      // 使用下载代理API避免CORS问题
      const downloadUrl = `/api/download-image?imageUrl=${encodeURIComponent(generatedImage)}&filename=${encodeURIComponent(filename)}`;

      // 创建隐藏的下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('下载开始:', filename);

    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };


  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
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
              <button className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/5 transition-colors group flex items-center justify-center">
                <Share2 className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
              </button>
              <button
                onClick={downloadGeneratedImage}
                className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/5 transition-colors group flex items-center justify-center"
                title={generatedImage ? "下载图片" : "暂无可下载图片"}
              >
                <Download className={`w-4 h-4 transition-colors ${generatedImage ? 'group-hover:text-blue-400' : 'text-gray-500'}`} />
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
                onClick={() => {
                  setSelectedTab('edit');
                  setGeneratedImage(null); // 清除生成的图片
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 ${
                  selectedTab === 'edit'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Edit Image
              </button>
              <button
                onClick={() => {
                  setSelectedTab('create');
                  setGeneratedImage(null); // 清除生成的图片
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 ${
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
                    </div>
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* 显示正在上传的loading状态 */}
                {Array.from(uploadingSlots).map((slotIndex) => (
                  <div key={`loading-${slotIndex}`} className="relative group">
                    <div className="aspect-square rounded-lg border-2 border-dashed border-blue-400/50 flex flex-col items-center justify-center bg-blue-500/10">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <div className="text-xs text-blue-400">上传中...</div>
                    </div>
                  </div>
                ))}

                {/* 显示添加按钮（如果还有空位且没有正在上传） */}
                {(uploadedImages.length + uploadingSlots.size) < 5 && (
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
                  className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. Change the background to a sunset beach scene."
                  className="w-full h-48 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-500/50 disabled:to-purple-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? 'Processing...' : 'Generate Now'}
            </button>

          </div>

          {/* 右侧显示区域 */}
          <div className="relative p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md">
            <div className="h-[80vh] border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center">
              {generatedImage ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={generatedImage}
                    alt="Generated image"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : isGenerating ? (
                <div className="text-center">
                  {/* Enhanced Loading Animation */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                    <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white text-xl font-semibold">Working...</h3>

                    {/* Timer Display */}
                    <div className="flex items-center justify-center gap-3 text-white/80 bg-white/5 rounded-lg py-3 px-4">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-2xl font-mono tracking-wider">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Generation Tips */}
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <p className="text-white/70 text-sm mb-2">🎨 AI is painting your masterpiece...</p>
                      <p className="text-white/50 text-xs">
                        Typical generation time: <span className="text-blue-400 font-medium">20-30 seconds</span>
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Please stay on this page while we work our magic
                      </p>
                    </div>

                    {/* Animated Progress Indicator */}
                    <div className="flex justify-center gap-1 mt-6">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/40">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-lg mb-2">Ready to Create</p>
                  <p className="text-sm">Enter your prompt and click Generate to start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditImagePage;