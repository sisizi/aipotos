'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Sparkles, Download, Share2, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import MouseParticles from '@/component/MouseParticles';
import Header from '@/component/Header';

/**
 * 编辑图片页面组件 - 支持异步任务处理
 * 提供图片上传、编辑和生成的功能界面
 */
const EditImagePage = () => {
  const t = useTranslations('imageEditor');

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<'edit' | 'create'>('edit'); // 当前选中的标签页（编辑或创建）
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // 已上传的图片URL列表
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]); // 选中要编辑的图片索引数组（多选）
  const [pendingUploadCount, setPendingUploadCount] = useState<number>(0); // 记录正在上传的图片数量
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
          setTaskMessage(t('taskTimeoutMarking'));
        } else if (elapsed >= 480) { // 8分钟后开始警告
          const remaining = 600 - elapsed;
          setTaskMessage(t('taskWillTimeout', { seconds: remaining }));
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
        alert(t('initializingUser'));
      }
      return;
    }

    const filesToUpload = Array.from(files);
    const initialImageCount = uploadedImages.length;

    // 检查文件大小和数量限制
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(t('imageSizeLimit'));
        return;
      }
      if (initialImageCount + filesToUpload.length > 5) {
        alert(t('imageCountLimit'));
        return;
      }
    }

    // 设置待上传数量
    setPendingUploadCount(filesToUpload.length);

    // 记录批量上传开始时的图片索引，用于后续自动选中
    const startingIndex = uploadedImages.length;
    const expectedNewIndices: number[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      expectedNewIndices.push(startingIndex + i);
    }

    // 批量上传所有图片
    const uploadPromises = filesToUpload.map(async (file, index) => {
      const currentSlotIndex = startingIndex + index;

      // 2秒后显示loading状态
      const loadingTimeout = setTimeout(() => {
        setUploadingSlots(prev => new Set([...prev, currentSlotIndex]));
      }, 2000);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('type', 'image');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearTimeout(loadingTimeout);

        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSlotIndex);
          return newSet;
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            return { success: true, url: result.data.url, index };
          } else {
            console.error('上传失败:', result.error || '未知错误');
            return { success: false, error: result.error || '未知错误' };
          }
        } else {
          const errorText = await response.text();
          console.error('上传失败:', errorText);
          return { success: false, error: errorText };
        }
      } catch (error) {
        clearTimeout(loadingTimeout);
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSlotIndex);
          return newSet;
        });
        console.error('上传错误:', error);
        return { success: false, error: error instanceof Error ? error.message : '网络错误' };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);

      // 处理上传结果
      const successfulUploads = results
        .filter(result => result.success)
        .sort((a, b) => (a.index || 0) - (b.index || 0)) // 按原始顺序排序
        .map(result => result.url);

      const failedUploads = results.filter(result => !result.success);

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).join(', ');
        alert(`部分图片上传失败: ${errorMessages}`);
      }

      if (successfulUploads.length > 0) {
        // 批量更新图片列表和选中状态
        setUploadedImages(prev => {
          const newImages = [...prev, ...successfulUploads].slice(0, 5);

          // 批量选中所有成功上传的图片
          const newIndices = successfulUploads.map((_, index) => startingIndex + index);
          setSelectedImageIndices(prevSelected => {
            // 合并现有选中和新上传的图片索引，并按数值排序
            const combined = [...prevSelected, ...newIndices];
            return [...new Set(combined)].sort((a, b) => a - b);
          });

          return newImages;
        });
      }

    } finally {
      // 重置待上传数量
      setPendingUploadCount(0);
    }
  };



  // 修复后的轮询检查函数
  const startSimplePolling = (taskId: string) => {
    setCurrentTaskId(taskId);
    setTaskProgress(10);
    setTaskMessage(t('taskCreated'));

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
                setTaskMessage(t('taskCompleted'));
                setTaskStartTime(null);
                return;
              } else if (task.status === 'failed') {
                isPollingActive = false;
                setIsGenerating(false);
                setCurrentTaskId(null);
                setTaskStartTime(null);
                setTaskProgress(0);
                setTaskMessage('');
                alert(t('taskFailed', { error: task.error_message || 'Unknown error' }));
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
              setTaskMessage(t('taskCompleted'));
              setTaskStartTime(null);
              return;

            } else if (task.status === 'failed') {
              isPollingActive = false;
              setIsGenerating(false);
              setCurrentTaskId(null);
              setTaskStartTime(null);
              setTaskProgress(0);
              setTaskMessage('');
              alert(t('taskFailed', { error: task.error_message || 'Unknown error' }));
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
          alert(t('taskTimeout'));
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


  const handleGenerate = async () => {
    if (!prompt.trim() || !userId) {
      if (!userId) {
        alert(t('initializingUser'));
      } else {
        alert(t('enterDescription'));
      }
      return;
    }

    // 编辑模式下需要确保有选中的图片
    if (selectedTab === 'edit' && uploadedImages.length === 0) {
      alert(t('editModeRequiresImages'));
      return;
    }

    if (selectedTab === 'edit' && selectedImageIndices.length === 0) {
      alert(t('selectImages'));
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
        // 如果是编辑模式且有选中的图片，传入所有选中的图片
        inputImages: isEditMode ? selectedImageIndices.map(index => uploadedImages[index]) : undefined,
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
        inputImages: requestBody.inputImages ? `[${requestBody.inputImages.length} IMAGE URLs]` : undefined
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
          alert(t('taskFailed', { error: result.error || 'Unknown error' }));
          setIsGenerating(false);
          setTaskStartTime(null);
        }
      } else {
        const errorText = await response.text();
        console.error('任务创建失败:', errorText);
        alert(t('taskFailed', { error: errorText }));
        setIsGenerating(false);
        setTaskStartTime(null);
      }
    } catch (error) {
      console.error('任务创建失败:', error);
      alert(t('taskFailed', { error: error instanceof Error ? error.message : 'Network error' }));
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
      alert(t('noImageToDownload'));
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
      alert(t('downloadFailed'));
    }
  };


  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* 鼠标粒子效果 */}
      <MouseParticles />

      {/* 使用统一的Header组件 */}
      <Header />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
          {/* 左侧控制面板 */}
          <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md h-full">
            {/* 标签页 */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setSelectedTab('edit');
                  setGeneratedImage(null); // 清除生成的图片
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 cursor-pointer ${
                  selectedTab === 'edit'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t('editImage')}
              </button>
              <button
                onClick={() => {
                  setSelectedTab('create');
                  setGeneratedImage(null); // 清除生成的图片
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 cursor-pointer ${
                  selectedTab === 'create'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t('createImage')}
              </button>
            </div>

            {/* 参考图片上传区域 - 在Create模式下隐藏 */}
            <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${
              selectedTab === 'edit'
                ? 'max-h-[1000px] opacity-100'
                : 'max-h-0 opacity-0'
            }`}>
              <div>
                <h3 className="text-lg font-semibold">{t('referenceImages')}</h3>
                <p className="text-sm text-white/60 mt-1">
                  {uploadedImages.length > 0
                    ? selectedImageIndices.length > 0
                      ? t('selectedImages', {
                          count: selectedImageIndices.length,
                          plural: selectedImageIndices.length > 1 ? 's' : '',
                          order: selectedImageIndices.map(i => i + 1).join(', ')
                        })
                      : t('clickToDeselect')
                    : t('uploadToStart')
                  }
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* 显示已上传的图片 */}
                {uploadedImages.map((image, index) => {
                  const isSelected = selectedImageIndices.includes(index);
                  // 显示序号基于在选中数组中的位置（按索引排序后的位置）
                  const sortedSelected = [...selectedImageIndices].sort((a, b) => a - b);
                  const selectionOrder = sortedSelected.indexOf(index) + 1;

                  return (
                    <div key={index} className="relative group">
                      <div
                        onClick={() => {
                          setSelectedImageIndices(prev => {
                            if (isSelected) {
                              // 取消选择
                              return prev.filter(i => i !== index);
                            } else {
                              // 添加选择，并保持数组按索引排序
                              const newSelected = [...prev, index];
                              return newSelected.sort((a, b) => a - b);
                            }
                          });
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/50'
                            : 'border-dashed border-white/20 hover:border-blue-400'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Reference ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                        {/* 多选指示器 */}
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{selectionOrder}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡
                          setUploadedImages(prev => prev.filter((_, i) => i !== index));
                          // 更新选中状态：移除被删除的索引，并调整其他索引
                          setSelectedImageIndices(prev =>
                            prev
                              .filter(i => i !== index) // 移除被删除的索引
                              .map(i => i > index ? i - 1 : i) // 调整大于被删除索引的数值
                          );
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors z-10 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* 显示正在上传的loading状态 */}
                {Array.from(uploadingSlots).map((slotIndex) => (
                  <div key={`loading-${slotIndex}`} className="relative group">
                    <div className="aspect-square rounded-lg border-2 border-dashed border-blue-400/50 flex flex-col items-center justify-center bg-blue-500/10">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <div className="text-xs text-blue-400">{t('uploading')}</div>
                    </div>
                  </div>
                ))}

                {/* 显示添加按钮（如果还有空位且没有正在上传） */}
                {(uploadedImages.length + uploadingSlots.size) < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors group"
                  >
                    <div className="text-3xl text-white/40 group-hover:text-blue-400 transition-colors">+</div>
                    <div className="text-xs text-white/60 mt-1">{t('addImage')}</div>
                    <div className="text-xs text-white/40">{t('maxSize')}</div>
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

            {/* 描述输入区域 */}
            <div className="space-y-4">
              <div>
                <label className="text-lg font-semibold">
                  {selectedTab === 'edit' && selectedImageIndices.length > 1
                    ? t('combinePrompt')
                    : selectedTab === 'edit'
                    ? t('editPrompt')
                    : t('createPrompt')
                  }
                </label>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedTab === 'edit' && selectedImageIndices.length > 1
                      ? t('placeholderCombine')
                      : selectedTab === 'edit'
                      ? t('placeholderEdit')
                      : t('placeholderCreate')
                  }
                  className="w-full h-32 sm:h-40 lg:h-48 px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-white/40">
                  {t('characters', { count: prompt.length })}
                </div>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !prompt.trim() ||
                (selectedTab === 'edit' && (uploadedImages.length === 0 || selectedImageIndices.length === 0))
              }
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-500/50 disabled:to-purple-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? t('processing') : t('generateNow')}
            </button>

          </div>

          {/* 右侧显示区域 */}
          <div className="flex flex-col h-full">
            {/* 图片显示框 - 外框 */}
            <div className="relative p-4 sm:p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md flex-1 transition-all duration-500 ease-in-out">
              {/* 内框 - 固定高度 */}
              <div className="h-[500px] border-2 border-dashed border-white/20 rounded-lg flex flex-col justify-between">
                {/* 图片/状态显示区域 */}
                <div className="flex-1 w-full flex items-center justify-center">
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
                        <h3 className="text-white text-xl font-semibold">{t('working')}</h3>

                        {/* Timer Display */}
                        <div className="flex items-center justify-center gap-3 text-white/80 bg-white/5 rounded-lg py-3 px-4">
                          <Clock className="w-5 h-5 text-blue-400" />
                          <span className="text-2xl font-mono tracking-wider">
                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Generation Tips */}
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <p className="text-white/70 text-sm mb-2">{t('aiPainting')}</p>
                          <p className="text-white/50 text-xs">
                            {t('typicalTime')} <span className="text-blue-400 font-medium">{t('seconds')}</span>
                          </p>
                          <p className="text-white/40 text-xs mt-1">
                            {t('stayOnPage')}
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
                      <p className="text-lg mb-2">{t('readyToCreate')}</p>
                      <p className="text-sm">{t('enterPrompt')}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* 按钮组 - 只在图像生成后显示 */}
              {generatedImage && (
                <div className="flex items-center gap-3 flex-wrap mt-6">
                  <button
                    className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors group cursor-pointer"
                    title={t('editThisImage')}
                  >
                    <span className="text-sm text-white">{t('editThisImage')}</span>
                  </button>
                  <button
                    onClick={downloadGeneratedImage}
                    disabled={!generatedImage}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md transition-colors group ${
                      generatedImage
                        ? 'hover:bg-black/60 cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    title={t('download')}
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span className="text-sm text-white">{t('download')}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors group cursor-pointer"
                    title={t('viewMyCreations')}
                  >
                    <span className="text-sm text-white">{t('viewMyCreations')}</span>
                  </button>
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