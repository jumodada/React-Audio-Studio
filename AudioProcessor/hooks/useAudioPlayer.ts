import { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Peaks from 'peaks.js';
import { uploadFile } from '../../../../api/verbalTricks.ts';

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2;
    const buffer2 = new ArrayBuffer(44 + length);
    const view = new DataView(buffer2);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;
  
    // 写入 WAV 文件头
    setUint32(0x46464952);                         // "RIFF"
    setUint32(36 + length);                        // 文件长度
    setUint32(0x45564157);                         // "WAVE"
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // 长度 = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length);                             // chunk length
  
    // 写入音频数据
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
  
    while (pos < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(44 + offset, sample, true);
        offset += 2;
      }
      pos++;
    }
  
    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  
    return buffer2;
}

export const useAudioPlayer = (audioUrl: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peaksRef = useRef<any>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);

  const isValidSegment = useCallback((segment: any) => {
    return segment && 
           !isNaN(segment.startTime) && 
           !isNaN(segment.endTime) && 
           segment.startTime >= 0 && 
           segment.endTime > segment.startTime &&
           audioRef.current &&
           segment.endTime <= audioRef.current.duration;
  }, []);

  const addDefaultSegment = useCallback(() => {
    if (peaksRef.current && audioRef.current && !isNaN(audioRef.current.duration)) {
      const duration = audioRef.current.duration;
      if (duration > 0 && !isNaN(duration)) {
        const segment = {
          startTime: 0,
          endTime: Math.min(2, duration),
          editable: true,
          color: '#ff9800',
          labelText: '选择截取区间',
          id: 'default-segment'
        };
        
        peaksRef.current.segments.add(segment);
        setSelectedSegment(segment);
      }
    }
  }, []);

  const segmentPlaybackControlRef = useRef<{
    animationId?: number;
    timeoutId?: NodeJS.Timeout;
    endTime?: number;
  }>({});

  const clearSegmentPlaybackControl = useCallback(() => {
    if (segmentPlaybackControlRef.current.animationId) {
      cancelAnimationFrame(segmentPlaybackControlRef.current.animationId);
      segmentPlaybackControlRef.current.animationId = undefined;
    }
    if (segmentPlaybackControlRef.current.timeoutId) {
      clearTimeout(segmentPlaybackControlRef.current.timeoutId);
      segmentPlaybackControlRef.current.timeoutId = undefined;
    }
    segmentPlaybackControlRef.current.endTime = undefined;
  }, []);

  // 初始化 Peaks.js
  useEffect(() => {
    if (audioUrl && waveformRef.current && audioRef.current) {
      if (peaksRef.current) {
        try {
          peaksRef.current.destroy();
        } catch (error) {
          console.warn('销毁Peaks实例时出错:', error);
        }
        peaksRef.current = null;
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setSelectedSegment(null);

      // 初始化 Peaks.js
      const options = {
        container: waveformRef.current,
        mediaElement: audioRef.current,
        webAudio: {
          audioContext: new (window.AudioContext || (window as any).webkitAudioContext)()
        },
        zoomLevels: [512, 1024, 2048, 4096],
        height: 120
      };

      // @ts-ignore
      Peaks.init(options, (err: any, peaks: any) => {
        if (err) {
          console.error('Failed to initialize Peaks.js:', err);
          return;
        }
        peaksRef.current = peaks;
        
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          addDefaultSegment();
        } else {
          const handleLoadedMetadata = () => {
            addDefaultSegment();
            audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          audioRef.current?.addEventListener('loadedmetadata', handleLoadedMetadata);
        }
        
        // 监听段选择事件
        peaks.on('segments.click', (segment: any) => {
          const isValid = segment && 
                         !isNaN(segment.startTime) && 
                         !isNaN(segment.endTime) && 
                         segment.startTime >= 0 && 
                         segment.endTime > segment.startTime &&
                         audioRef.current &&
                         segment.endTime <= audioRef.current.duration;
          if (isValid) {
            setSelectedSegment(segment);
          }
        });

        // 监听拖拽过程中的约束
        peaks.on('segments.dragged', function(event: any) {
          if (!audioRef.current || isNaN(audioRef.current.duration)) {
            return;
          }

          const audioDuration = audioRef.current.duration;
          let constrainedStartTime = event.segment.startTime;
          let constrainedEndTime = event.segment.endTime;
          let needsUpdate = false;
          
          // 约束开始时间
          if (constrainedStartTime < 0) {
            constrainedStartTime = 0;
            needsUpdate = true;
          }
          
          // 约束结束时间
          if (constrainedEndTime > audioDuration) {
            constrainedEndTime = audioDuration;
            needsUpdate = true;
          }
          
          // 确保结束时间大于开始时间
          if (constrainedEndTime <= constrainedStartTime) {
            constrainedEndTime = Math.min(constrainedStartTime + 0.1, audioDuration);
            needsUpdate = true;
          }

          if (needsUpdate) {
            try {
              // 使用约束后的值更新segment位置
              event.segment.update({
                startTime: constrainedStartTime,
                endTime: constrainedEndTime
              });
            } catch (error) {
              console.warn('拖拽过程中更新segment位置时出错:', error);
            }
          }
        });

        peaks.on('segments.dragend', function(event: any) {
          if (!audioRef.current || isNaN(audioRef.current.duration)) {
            return;
          }

          const audioDuration = audioRef.current.duration;
          let updatedSegment = {
            ...event.segment,
            startTime: event.segment.startTime,
            endTime: event.segment.endTime
          };

          // 自动修正超出范围的时间
          let needsUpdate = false;
          
          // 修正开始时间（不能小于0）
          if (updatedSegment.startTime < 0) {
            updatedSegment.startTime = 0;
            needsUpdate = true;
          }
          
          // 修正结束时间（不能超过音频总时长）
          if (updatedSegment.endTime > audioDuration) {
            updatedSegment.endTime = audioDuration;
            needsUpdate = true;
          }
          
          // 确保结束时间大于开始时间
          if (updatedSegment.endTime <= updatedSegment.startTime) {
            updatedSegment.endTime = Math.min(updatedSegment.startTime + 0.1, audioDuration);
            needsUpdate = true;
          }

          // 如果需要更新segment位置，通过peaks更新实际segment
          if (needsUpdate) {
            try {
              // 更新peaks中的segment位置
              event.segment.update({
                startTime: updatedSegment.startTime,
                endTime: updatedSegment.endTime
              });
            } catch (error) {
              console.warn('更新segment位置时出错:', error);
            }
          }

          // 验证segment是否有效
          const isValid = updatedSegment && 
                         !isNaN(updatedSegment.startTime) && 
                         !isNaN(updatedSegment.endTime) && 
                         updatedSegment.startTime >= 0 && 
                         updatedSegment.endTime > updatedSegment.startTime &&
                         updatedSegment.endTime <= audioDuration;
          
          if (isValid) {
            setSelectedSegment(updatedSegment);
          }
        });

        // 监听波形点击事件 - 仅用于设置播放位置
        peaks.on('zoomview.click', function(event: any) {
          if (event.time && !isNaN(event.time) && audioRef.current && !isNaN(audioRef.current.duration)) {
            // 只设置播放位置，不创建或移动选择区间
            audioRef.current.currentTime = event.time;
          }
        });
      });
    }

    return () => {
      if (peaksRef.current) {
        try {
          peaksRef.current.destroy();
        } catch (error) {
          console.warn('清理Peaks实例时出错:', error);
        }
        peaksRef.current = null;
      }
      clearSegmentPlaybackControl();
    };
  }, [audioUrl, addDefaultSegment, clearSegmentPlaybackControl]);

  const handlePlayPause = useCallback((initAudioProcessing: (audioElement: HTMLAudioElement) => void) => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearSegmentPlaybackControl(); // 清理区间播放控制
      return;
    }

    // 清理之前的区间播放控制
    clearSegmentPlaybackControl();

    try {
      initAudioProcessing(audioRef.current);
    } catch (error) {
      console.error('音频初始化失败:', error);
      return;
    }
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(error => {
      console.error('音频播放失败:', error);
    });
  }, [isPlaying, clearSegmentPlaybackControl]);

  // 高精度检查播放位置
  const checkPlaybackPosition = useCallback(() => {
    if (!audioRef.current || !segmentPlaybackControlRef.current.endTime) {
      return;
    }

    const currentTime = audioRef.current.currentTime;
    const endTime = segmentPlaybackControlRef.current.endTime;
    
    // 检查是否到达或超过结束时间（允许10毫秒的误差）
    if (currentTime >= endTime - 0.01) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearSegmentPlaybackControl();
      return;
    }

    // 继续监控
    segmentPlaybackControlRef.current.animationId = requestAnimationFrame(checkPlaybackPosition);
  }, [clearSegmentPlaybackControl]);

  // 在选中区间内播放
  const playSelectedSegment = useCallback((initAudioProcessing: (audioElement: HTMLAudioElement) => void) => {
    if (!audioRef.current || !isValidSegment(selectedSegment)) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearSegmentPlaybackControl();
      return;
    }

    try {
      initAudioProcessing(audioRef.current);
    } catch (error) {
      console.error('音频初始化失败:', error);
      return;
    }

    // 清理之前的控制
    clearSegmentPlaybackControl();

    // 设置播放位置到区间开始
    audioRef.current.currentTime = selectedSegment.startTime;
    
    // 记录结束时间
    segmentPlaybackControlRef.current.endTime = selectedSegment.endTime;
    
    // 计算播放时长并设置备用定时器
    const duration = selectedSegment.endTime - selectedSegment.startTime;
    segmentPlaybackControlRef.current.timeoutId = setTimeout(() => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        clearSegmentPlaybackControl();
      }
    }, duration * 1000 + 50); // 增加50毫秒缓冲

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      // 开始高精度监控
      segmentPlaybackControlRef.current.animationId = requestAnimationFrame(checkPlaybackPosition);
    }).catch(error => {
      console.error('音频播放失败:', error);
      clearSegmentPlaybackControl();
    });
  }, [isPlaying, selectedSegment, isValidSegment, clearSegmentPlaybackControl, checkPlaybackPosition]);

  const handleZoomIn = useCallback(() => {
    if (peaksRef.current) {
      peaksRef.current.zoom.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (peaksRef.current) {
      peaksRef.current.zoom.zoomOut();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const formatTimePrecise = useCallback((time: number) => {
    if (isNaN(time) || time < 0) {
      return '00:00.000';
    }
    
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.round((time - totalSeconds) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }, []);

  // 时间格式化函数
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 仅用于下载的音频处理
  const processAudioForDownload = useCallback(async (
    startTime?: number, 
    endTime?: number,
    outputFormat: string = 'WAV'
  ) => {
    try {
      if (!audioRef.current) {
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const actualStartTime = startTime || 0;
      const actualEndTime = endTime || audioBuffer.duration;
      const startSample = Math.floor(actualStartTime * audioBuffer.sampleRate);
      const endSample = Math.floor(actualEndTime * audioBuffer.sampleRate);
      const cropLength = endSample - startSample;

      const croppedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        cropLength,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const croppedData = croppedBuffer.getChannelData(channel);
        for (let i = 0; i < cropLength; i++) {
          croppedData[i] = originalData[startSample + i];
        }
      }

      let processedBlob: Blob;
      if (outputFormat === 'WAV') {
        const wav = audioBufferToWav(croppedBuffer);
        processedBlob = new Blob([wav], { type: 'audio/wav' });
      } else if (outputFormat === 'OPUS') {
        const wav = audioBufferToWav(croppedBuffer);
        processedBlob = new Blob([wav], { type: 'audio/wav' });
      } else {
        const wav = audioBufferToWav(croppedBuffer);
        processedBlob = new Blob([wav], { type: 'audio/wav' });
      }
      
      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = startTime !== undefined && endTime !== undefined 
        ? `cropped_audio_${formatTime(actualStartTime)}-${formatTime(actualEndTime)}.${outputFormat.toLowerCase()}`
        : `processed_audio.${outputFormat.toLowerCase()}`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('音频处理失败:', error);
    }
  }, [audioUrl, formatTime]);

  // 处理音频截取并上传
  const handleCropAndSubmit = useCallback(async (
    processAudio: (startTime?: number, endTime?: number) => Promise<Blob | undefined>,
    outputFormat: string,
    bitRate: string,
    onSubmit?: (params: { file_url: string; file_type: string }) => void
  ) => {
    if (!isValidSegment(selectedSegment)) {
      return;
    }
    
    try {
      const processedBlob = await processAudio(selectedSegment.startTime, selectedSegment.endTime);
      if (!processedBlob) {
        throw new Error('音频处理失败');
      }
      
      const formData = new FormData();
      const fileExtension = outputFormat === 'OPUS' ? 'opus' : outputFormat.toLowerCase();
      const qualityInfo = outputFormat === 'WAV' ? `${bitRate}bit` : `${bitRate}kbps`;
      const fileName = `cropped_audio_${formatTime(selectedSegment.startTime)}-${formatTime(selectedSegment.endTime)}_${qualityInfo}.${fileExtension}`;
      formData.append('file', processedBlob, fileName);
      
      const res = await uploadFile(formData);
      if (res.data && res.data.file_path) {
        const params = {
          file_url: res.data.file_path,
          file_type: fileExtension
        };
        
        if (onSubmit) {
          onSubmit(params);
        }
        
      } else {
        throw new Error('上传响应格式错误');
      }
    } catch (error) {
      console.error('截取上传失败:', error);
    }
  }, [selectedSegment, isValidSegment, formatTime]);

  return {
    // 状态
    isPlaying,
    currentTime,
    duration,
    selectedSegment,
    
    // 引用
    audioRef,
    waveformRef,
    overviewRef,
    
    // 方法
    handlePlayPause,
    playSelectedSegment,
    handleZoomIn,
    handleZoomOut,
    handleTimeUpdate,
    handleLoadedMetadata,
    formatTime,
    formatTimePrecise,
    isValidSegment,
    
    // 设置方法
    setIsPlaying,
    
    // 新方法
    processAudioForDownload,
    handleCropAndSubmit,
  };
}; 