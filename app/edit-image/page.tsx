'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Copy, Sparkles, ArrowLeft, Download, Share2, Clock } from 'lucide-react';
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
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number>(0); // 预估剩余时间
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) {
      if (!userId) {
        alert('正在初始化用户信息，请稍后重试');
      }
      return;
    }

    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 改为10MB限制，与API一致
        alert('图片大小不能超过10MB');
        continue;
      }

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
            newImages.push(result.data.url);
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
        console.error('上传错误:', error);
        alert(`上传错误: ${error instanceof Error ? error.message : '网络错误'}`);
      }
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5)); // 最多5张图片
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
            setTaskMessage('任务完成！');
            console.log('图像生成完成:', task.output_image_url);
            return false; // 停止轮询
          } else if (progress.status === 'failed') {
            // 任务失败
            setIsGenerating(false);
            setCurrentTaskId(null);
            alert(`任务失败: ${progress.message}`);
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
    setCurrentTaskId(taskId);
    setTaskProgress(10);
    setTaskMessage('任务已创建，正在处理中...');

    const pollInterval = setInterval(async () => {
      const shouldContinue = await pollTaskStatus(taskId);
      if (!shouldContinue) {
        clearInterval(pollInterval);
      }
    }, 2000); // 每2秒轮询一次

    // 5分钟后自动停止轮询
    setTimeout(() => {
      clearInterval(pollInterval);
      if (currentTaskId === taskId) {
        setIsGenerating(false);
        setCurrentTaskId(null);
        alert('任务处理超时，请稍后手动查询');
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

    setIsGenerating(true);
    setGeneratedImage(null);
    setTaskProgress(0);
    setTaskMessage('');

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
          // 开始轮询任务状态
          startTaskPolling(result.data.taskId);
        } else {
          console.error('任务创建失败:', result.error || '未知错误');
          alert(`任务创建失败: ${result.error || '未知错误'}`);
          setIsGenerating(false);
        }
      } else {
        const errorText = await response.text();
        console.error('任务创建失败:', errorText);
        alert(`任务创建失败: ${errorText}`);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('任务创建失败:', error);
      alert(`任务创建失败: ${error instanceof Error ? error.message : '网络错误'}`);
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
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
              <button className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/5 transition-colors group flex items-center justify-center">
                <Download className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
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
                onClick={() => setSelectedTab('create')}
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

                {uploadedImages.length < 5 && (
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
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-500/50 disabled:to-purple-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
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
          <div className="relative p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md">
            <div className="h-80 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center">
              {generatedImage ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={generatedImage}
                    alt="Generated image"
                    fill
                    className="object-contain rounded-lg"
                  />
                  {/* 添加下载按钮 */}
                  {/* <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={generatedImage}
                      download="generated-image.jpg"
                      className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </a>
                  </div> */}
                </div>
              ) : isGenerating ? (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-white/60 text-lg mb-2">正在创作您的作品...</p>
                  <p className="text-white/40 text-sm">{taskMessage}</p>
                  <div className="mt-4 w-32 mx-auto">
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${taskProgress}%` }}
                      ></div>
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
        </div>
      </div>
    </div>
  );
};

export default EditImagePage;