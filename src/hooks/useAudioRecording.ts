import { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Recorder from 'recorder-core';
import 'recorder-core/src/engine/wav';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';
import 'recorder-core/src/extensions/wavesurfer.view';
import { useDeviceAudioCapabilities } from './useDeviceAudioCapabilities';
import { RecordingState, AudioGeneratedCallback, AudioClearCallback, RecordingStateChangeCallback } from '../types';

export interface UseAudioRecordingOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  enableWaveform?: boolean;
}

export const useAudioRecording = (options: UseAudioRecordingOptions = {}) => {
  const { onError, onSuccess, enableWaveform = true } = options;
  
  const { 
    maxSampleRate, 
    isLoading: isCapabilityLoading,
    error: capabilityError,
    formatSampleRate,
    deviceInfo
  } = useDeviceAudioCapabilities();
  
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isRecordingReady: false,
    recordingDuration: 0,
    isGettingPermission: false,
  });
  
  const recorderRef = useRef<any>(null);
  const recordingWaveRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveViewRef = useRef<any>(null);

  const updateRecordingState = useCallback((updates: Partial<RecordingState>) => {
    setRecordingState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanupRecorder = useCallback(() => {
    if (recorderRef.current) {
      try {
        recorderRef.current.close();
      } catch (e) {
        console.warn('清理旧录音器时出错:', e);
      }
      recorderRef.current = null;
    }

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
  }, []);

  const getRecorderPermission = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        cleanupRecorder();
        
        const rec = Recorder({
          type: 'wav',
          sampleRate: maxSampleRate,
          bitRate: 320,
          disableEnvInAndroid: false,
          // 音频处理回调
          onProcess: function(buffers: any[], powerLevel: number, _bufferDuration: number, bufferSampleRate: number) {
            if (enableWaveform && waveViewRef.current && buffers && buffers.length > 0) {
              try {
                waveViewRef.current.input(buffers[buffers.length - 1], powerLevel, bufferSampleRate);
              } catch (e) {
                console.warn('波形更新时出错:', e);
              }
            }
          }
        });

        rec.open(
          function() {
            try {
              if (enableWaveform && Recorder.WaveSurferView && recordingWaveRef.current) {
                recordingWaveRef.current.innerHTML = '';
                waveViewRef.current = Recorder.WaveSurferView({elem: recordingWaveRef.current});
              }
              updateRecordingState({ isRecordingReady: true });
              recorderRef.current = rec;
              
              onSuccess?.('录音权限获取成功');
              resolve(true);
            } catch (error) {
              console.error('创建波形视图失败:', error);
              updateRecordingState({ isRecordingReady: true });
              recorderRef.current = rec;
              resolve(true);
            }
          },
          function(msg: string, isUserNotAllow: boolean) {
            const errorMsg = (isUserNotAllow ? "用户拒绝，" : "") + "无法录音:" + msg;
            console.log(errorMsg);
            onError?.(errorMsg);
            updateRecordingState({ isRecordingReady: false });
            resolve(false);
          }
        );
      } catch (error) {
        const errorMsg = '录音器初始化失败';
        console.error(errorMsg, error);
        onError?.(errorMsg);
        resolve(false);
      }
    });
  }, [maxSampleRate, enableWaveform, cleanupRecorder, updateRecordingState, onError, onSuccess]);

  const startRecording = useCallback(async (
    onClearAudio: AudioClearCallback,
    onRecordingStateChange?: RecordingStateChangeCallback
  ) => {
    if (recordingState.isRecording || recordingState.isGettingPermission) {
      return;
    }

    if (isCapabilityLoading) {
      onError?.('设备音频能力检测中，请稍后再试');
      return;
    }

    onClearAudio();

    if (!recordingState.isRecordingReady || !recorderRef.current) {
      updateRecordingState({ isGettingPermission: true });
      const permissionGranted = await getRecorderPermission();
      updateRecordingState({ isGettingPermission: false });
      
      if (!permissionGranted) {
        return;
      }
    }

    try {
      recorderRef.current.start();
      updateRecordingState({ isRecording: true, recordingDuration: 0 });
      onRecordingStateChange?.(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, recordingDuration: prev.recordingDuration + 1 }));
      }, 1000);

    } catch (error) {
      const errorMsg = '开始录音失败';
      console.error(errorMsg, error);
      onError?.(errorMsg);
      updateRecordingState({ isRecording: false });
      onRecordingStateChange?.(false);
    }
  }, [
    recordingState.isRecording, 
    recordingState.isGettingPermission, 
    recordingState.isRecordingReady,
    isCapabilityLoading, 
    getRecorderPermission, 
    updateRecordingState,
    onError
  ]);

  // 停止录音
  const stopRecording = useCallback((
    onAudioGenerated: AudioGeneratedCallback,
    onRecordingStateChange?: RecordingStateChangeCallback
  ) => {
    if (!recorderRef.current || !recordingState.isRecording) {
      return;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      recorderRef.current.stop(
        function(blob: Blob) {
          try {
            const localUrl = URL.createObjectURL(blob);
            onAudioGenerated(localUrl);
            
            updateRecordingState({
              isRecording: false,
              recordingDuration: 0,
              isRecordingReady: false
            });
            onRecordingStateChange?.(false);
            
            cleanupRecorder();
            onSuccess?.('录音完成');
            
          } catch (error) {
            console.error('处理录音结果时出错:', error);
            onError?.('处理录音结果失败');
          }
        },
        function(msg: string) {
          const errorMsg = "录音失败:" + msg;
          console.log(errorMsg);
          onError?.(errorMsg);
          updateRecordingState({
            isRecording: false,
            recordingDuration: 0,
            isRecordingReady: false
          });
          onRecordingStateChange?.(false);
          cleanupRecorder();
        }
      );
    } catch (error) {
      console.error('停止录音时出错:', error);
      onError?.('停止录音失败');
    }
  }, [recordingState.isRecording, cleanupRecorder, updateRecordingState, onError, onSuccess]);

  // 格式化录音时间
  const formatRecordingTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      cleanupRecorder();
    };
  }, [cleanupRecorder]);

  return {
    ...recordingState,
    startRecording,
    stopRecording,
    formatRecordingTime,
    recordingWaveRef,
    isCapabilityLoading,
    capabilityError,
    deviceInfo,
    maxSampleRate: formatSampleRate(maxSampleRate),
  };
}; 