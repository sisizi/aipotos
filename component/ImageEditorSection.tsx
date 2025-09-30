'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Sparkles, Download, Share2, Clock } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

/**
 * 图像编辑组件 - 提供图片上传、编辑和生成的功能界面
 */
const ImageEditorSection = () => {
  const t = useTranslations('imageEditor');

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<'edit' | 'create'>('edit');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [taskMessage, setTaskMessage] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成或获取用户ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('temp_user_id');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('temp_user_id', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && taskStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - taskStartTime) / 1000);
        setElapsedTime(elapsed);
        if (elapsed >= 600) {
          setTaskMessage(t('taskTimeoutMarking'));
        } else if (elapsed >= 480) {
          const remaining = 600 - elapsed;
          setTaskMessage(t('taskWillTimeout', { seconds: remaining }));
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, taskStartTime]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) {
      if (!userId) alert(t('initializingUser'));
      return;
    }

    const filesToUpload = Array.from(files);
    const initialImageCount = uploadedImages.length;

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

    const startingIndex = uploadedImages.length;
    const uploadPromises = filesToUpload.map(async (file, index) => {
      const currentSlotIndex = startingIndex + index;
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
          }
        }
        return { success: false, error: 'Upload failed' };
      } catch (error) {
        clearTimeout(loadingTimeout);
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSlotIndex);
          return newSet;
        });
        return { success: false, error: error instanceof Error ? error.message : 'Network error' };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results
        .filter(result => result.success)
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .map(result => result.url);

      if (successfulUploads.length > 0) {
        setUploadedImages(prev => {
          const newImages = [...prev, ...successfulUploads].slice(0, 5);
          const newIndices = successfulUploads.map((_, index) => startingIndex + index);
          setSelectedImageIndices(prevSelected => {
            const combined = [...prevSelected, ...newIndices];
            return [...new Set(combined)].sort((a, b) => a - b);
          });
          return newImages;
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const startSimplePolling = (taskId: string) => {
    setCurrentTaskId(taskId);
    setTaskProgress(10);
    setTaskMessage(t('taskCreated'));

    let checkCount = 0;
    const maxChecks = 120;
    let isPollingActive = true;

    const checkTask = async () => {
      if (!isPollingActive) return;
      checkCount++;

      try {
        try {
          const cacheResponse = await fetch(`/api/tasks/${taskId}/quick`);
          if (cacheResponse.ok) {
            const cacheResult = await cacheResponse.json();
            if (cacheResult.success && cacheResult.data) {
              const task = cacheResult.data;
              if (task.status === 'completed' && task.output_image_url) {
                isPollingActive = false;
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
                alert(t('taskFailed', { error: task.error_message || 'Unknown error' }));
                return;
              }
            }
          }
        } catch (cacheError) {
          // Silently handle cache errors
        }

        const taskResponse = await fetch(`/api/tasks/${taskId}?userId=${userId}`);
        if (taskResponse.ok) {
          const taskResult = await taskResponse.json();
          if (taskResult.success && taskResult.data) {
            const task = taskResult.data;
            if (task.status === 'completed' && task.output_image_url) {
              isPollingActive = false;
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
              alert(t('taskFailed', { error: task.error_message || 'Unknown error' }));
              return;
            }
          }
        }

        if (checkCount < maxChecks && isPollingActive) {
          setTimeout(checkTask, 3000);
        } else if (checkCount >= maxChecks) {
          isPollingActive = false;
          setIsGenerating(false);
          setCurrentTaskId(null);
          setTaskStartTime(null);
          alert(t('taskTimeout'));
        }
      } catch (error) {
        if (checkCount < maxChecks && isPollingActive) {
          setTimeout(checkTask, 2000);
        }
      }
    };

    setTimeout(checkTask, 25000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !userId) {
      if (!userId) {
        alert(t('initializingUser'));
      } else {
        alert(t('enterDescription'));
      }
      return;
    }

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

    try {
      const isEditMode = selectedTab === 'edit' && uploadedImages.length > 0;
      const requestBody = {
        prompt: prompt.trim(),
        userId: userId,
        inputImages: isEditMode ? selectedImageIndices.map(index => uploadedImages[index]) : undefined,
        width: 512,
        height: 512,
        steps: 20,
        guidance_scale: 7.5,
        strength: 0.8,
      };

      const apiEndpoint = isEditMode ? '/api/ai/edit' : '/api/ai/generate';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.taskId) {
          startSimplePolling(result.data.taskId);
        } else {
          alert(t('taskFailed', { error: result.error || 'Unknown error' }));
          setIsGenerating(false);
          setTaskStartTime(null);
        }
      } else {
        const errorText = await response.text();
        alert(t('taskFailed', { error: errorText }));
        setIsGenerating(false);
        setTaskStartTime(null);
      }
    } catch (error) {
      alert(t('taskFailed', { error: error instanceof Error ? error.message : 'Network error' }));
      setIsGenerating(false);
      setTaskStartTime(null);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const downloadGeneratedImage = async () => {
    if (!generatedImage) {
      alert(t('noImageToDownload'));
      return;
    }
    try {
      const filename = `ai-generated-image-${Date.now()}.png`;
      const downloadUrl = `/api/download-image?imageUrl=${encodeURIComponent(generatedImage)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(t('downloadFailed'));
    }
  };

  return (
    <section className="pt-8 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
          {/* Left Control Panel */}
          <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md h-full">
            {/* Tab Selection */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setSelectedTab('edit');
                  setGeneratedImage(null);
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
                  setGeneratedImage(null);
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

            {/* Image Upload Area */}
            <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${
              selectedTab === 'edit'
                ? 'max-h-[1000px] opacity-100'
                : 'max-h-0 opacity-0'
            }`}>
                <div>
                  <h3 className="text-base font-semibold">{t('referenceImages')}</h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    {uploadedImages.length > 0
                      ? selectedImageIndices.length > 0
                        ? t('selectedImages', {
                            count: selectedImageIndices.length,
                            plural: selectedImageIndices.length > 1 ? 's' : '',
                            order: selectedImageIndices.map(i => i + 1).join(', ')
                          })
                        : t('clickToDeselect')
                      : t('uploadToStart')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((image, index) => {
                    const isSelected = selectedImageIndices.includes(index);
                    const sortedSelected = [...selectedImageIndices].sort((a, b) => a - b);
                    const selectionOrder = sortedSelected.indexOf(index) + 1;

                    return (
                      <div key={index} className="relative group">
                        <div
                          onClick={() => {
                            setSelectedImageIndices(prev => {
                              if (isSelected) {
                                return prev.filter(i => i !== index);
                              } else {
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
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{selectionOrder}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImages(prev => prev.filter((_, i) => i !== index));
                            setSelectedImageIndices(prev =>
                              prev
                                .filter(i => i !== index)
                                .map(i => i > index ? i - 1 : i)
                            );
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors z-10 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {Array.from(uploadingSlots).map((slotIndex) => (
                    <div key={`loading-${slotIndex}`} className="relative group">
                      <div className="aspect-square rounded-lg border-2 border-dashed border-blue-400/50 flex flex-col items-center justify-center bg-blue-500/10">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <div className="text-xs text-blue-400">{t('uploading')}</div>
                      </div>
                    </div>
                  ))}

                  {(uploadedImages.length + uploadingSlots.size) < 5 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors group"
                    >
                      <div className="text-4xl text-white/40 group-hover:text-blue-400 transition-colors">+</div>
                      <div className="text-sm text-white/60 mt-2">{t('addImage')}</div>
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

            {/* Prompt Input */}
            <div className="space-y-3">
              <div>
                <label className="text-base font-semibold">
                  {selectedTab === 'edit' ? t('editPrompt') : t('createPrompt')}
                </label>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedTab === 'edit'
                      ? t('placeholderEdit')
                      : t('placeholderCreate')
                  }
                  className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-white/40">
                  {t('characters', { count: prompt.length })}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !prompt.trim() ||
                (selectedTab === 'edit' && (uploadedImages.length === 0 || selectedImageIndices.length === 0))
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-500/50 disabled:to-purple-600/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? t('processing') : t('generateNow')}
            </button>
          </div>

          {/* Right Display Area */}
          <div className="flex flex-col h-full">
            {/* Image Display Box - Outer Frame */}
            <div className="relative p-4 sm:p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md flex-1 transition-all duration-500 ease-in-out">
              {/* Inner Frame - Fixed Height */}
              <div className="h-[500px] border-2 border-dashed border-white/20 rounded-lg flex flex-col justify-between">
                {/* Image/Status Display Area */}
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
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-white text-xl font-semibold">{t('working')}</h3>
                        <div className="flex items-center justify-center gap-3 text-white/80 bg-white/5 rounded-lg py-3 px-4">
                          <Clock className="w-5 h-5 text-blue-400" />
                          <span className="text-2xl font-mono tracking-wider">
                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <p className="text-white/70 text-sm mb-2">{t('aiPainting')}</p>
                          <p className="text-white/50 text-xs">
                            {t('typicalTime')} <span className="text-blue-400 font-medium">{t('seconds')}</span>
                          </p>
                          <p className="text-white/40 text-xs mt-1">
                            {t('stayOnPage')}
                          </p>
                        </div>
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
              {/* Button Group - Only show after image generated */}
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
    </section>
  );
};

export default ImageEditorSection;