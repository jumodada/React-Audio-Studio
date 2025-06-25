import { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Recorder from 'recorder-core';
import 'recorder-core/src/engine/wav';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';
import 'recorder-core/src/extensions/wavesurfer.view';
import { useDeviceAudioCapabilities } from './useDeviceAudioCapabilities';

export const useAudioRecording = () => {
  
  // 获取设备音频能力
  const { 
    maxSampleRate, 
    isLoading: isCapabilityLoading,
    error: capabilityError,
    formatSampleRate,
    deviceInfo
  } = useDeviceAudioCapabilities();
  
  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingReady, setIsRecordingReady] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isGettingPermission, setIsGettingPermission] = useState(false);
  
  // 录音相关引用
  const recorderRef = useRef<any>(null);
  const recordingWaveRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveViewRef = useRef<any>(null);


  // 获取录音权限
  const getRecorderPermission = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      try {
        // 清理旧的录音器实例
        if (recorderRef.current) {
          try {
            recorderRef.current.close();
          } catch (e) {
            console.warn('清理旧录音器时出错:', e);
          }
          recorderRef.current = null;
        }

        // 清理旧的波形视图
        if (waveViewRef.current) {
          try {
            if (recordingWaveRef.current) {
              recordingWaveRef.current.innerHTML = '';
            }
          } catch (e) {
            console.warn('清理波形视图时出错:', e);
          }
          waveViewRef.current = null;
        }
        
        const rec = Recorder({
          type: 'wav',
          sampleRate: maxSampleRate,
          bitRate: 320,
          disableEnvInAndroid: false, // 允许在Android环境中运行
          // 音频处理回调
          onProcess: function(buffers: any[], powerLevel: number, _bufferDuration: number, bufferSampleRate: number) {
            if (waveViewRef.current && buffers && buffers.length > 0) {
              try {
                waveViewRef.current.input(buffers[buffers.length - 1], powerLevel, bufferSampleRate);
              } catch (e) {
                console.warn('波形更新时出错:', e);
              }
            }
          }
        });

        rec.open(function() {
          try {
            if (Recorder.WaveSurferView && recordingWaveRef.current) {
              recordingWaveRef.current.innerHTML = '';
              waveViewRef.current = Recorder.WaveSurferView({elem: recordingWaveRef.current});
            }
            setIsRecordingReady(true);
            recorderRef.current = rec;
            
            resolve(true);
          } catch (error) {
            console.error('创建波形视图失败:', error);
            setIsRecordingReady(true);
            recorderRef.current = rec;
            resolve(true);
          }
        }, function(msg: string, isUserNotAllow: boolean) {
          console.log((isUserNotAllow ? "UserNotAllow，" : "") + "无法录音:" + msg);
          setIsRecordingReady(false);
          resolve(false);
        });
      } catch (error) {
        console.error('录音器初始化失败:', error);
        resolve(false);
      }
    });
  }, [deviceInfo]);

  const startRecording = useCallback(async (onClearAudio: () => void) => {
    if (isRecording) {
      return;
    }

    if (isGettingPermission) {
      return;
    }

    // 如果设备能力还在检测中，先等待
    if (isCapabilityLoading) {
      return;
    }

    onClearAudio();

    if (!isRecordingReady || !recorderRef.current) {
      setIsGettingPermission(true);
      const permissionGranted = await getRecorderPermission();
      setIsGettingPermission(false);
      
      if (!permissionGranted) {
        return;
      }
      
    }

    try {
      recorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      setIsRecording(false);
    }
  }, [isRecording, isGettingPermission, isRecordingReady, isCapabilityLoading, getRecorderPermission, formatSampleRate]);

  const stopRecording = useCallback((onAudioGenerated: (url: string) => void) => {
    if (!recorderRef.current || !isRecording) {
      return;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      recorderRef.current.stop(function(blob: Blob) {
        try {
          const localUrl = URL.createObjectURL(blob);
          onAudioGenerated(localUrl);
          
          setIsRecording(false);
          setRecordingDuration(0);
          
          if (recorderRef.current) {
            recorderRef.current.close();
            recorderRef.current = null;
          }
          setIsRecordingReady(false);
          
          if (waveViewRef.current) {
            waveViewRef.current = null;
          }
          if (recordingWaveRef.current) {
            recordingWaveRef.current.innerHTML = '';
          }
          
        } catch (error) {
          console.error('处理录音结果时出错:', error);
        }
      }, function(msg: string) {
        console.log("录音失败:" + msg);
        setIsRecording(false);
        setRecordingDuration(0);
        
        if (recorderRef.current) {
          try {
            recorderRef.current.close();
          } catch (e) {
            console.warn('清理录音器时出错:', e);
          }
          recorderRef.current = null;
        }
        setIsRecordingReady(false);
        
        if (waveViewRef.current) {
          waveViewRef.current = null;
        }
        if (recordingWaveRef.current) {
          recordingWaveRef.current.innerHTML = '';
        }
      });
    } catch (error) {
      console.error('停止录音时出错:', error);
      
      setIsRecording(false);
      setRecordingDuration(0);
      setIsRecordingReady(false);
      
      if (recorderRef.current) {
        try {
          recorderRef.current.close();
        } catch (e) {
          console.warn('强制清理录音器时出错:', e);
        }
        recorderRef.current = null;
      }
    }
  }, [isRecording, formatSampleRate]);

  const closeRecorder = useCallback(() => {
    try {
      if (isRecording && recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        setIsRecording(false);
        setRecordingDuration(0);
      }

      if (recorderRef.current) {
        try {
          recorderRef.current.close();
        } catch (e) {
          console.warn('关闭录音器时出错:', e);
        }
        recorderRef.current = null;
      }

      if (waveViewRef.current) {
        waveViewRef.current = null;
      }
      if (recordingWaveRef.current) {
        recordingWaveRef.current.innerHTML = '';
      }

      setIsRecordingReady(false);
      setIsGettingPermission(false);
    } catch (error) {
      console.error('关闭录音器失败:', error);
    }
  }, [isRecording]);

  // 清理录音资源
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recorderRef.current) {
        try {
          recorderRef.current.close();
        } catch (error) {
          console.warn('清理录音资源时出错:', error);
        }
      }
    };
  }, []);

  return {
    // 状态
    isRecording,
    isRecordingReady,
    recordingDuration,
    isGettingPermission,
    
    // 音频能力信息（直接来自设备检测hook）
    maxSampleRate,
    isCapabilityLoading,
    capabilityError,
    deviceInfo,
    
    // 引用
    recordingWaveRef,
    
    // 方法
    startRecording,
    stopRecording,
    closeRecorder,
    getRecorderPermission,
    formatSampleRate,
  };
}; 