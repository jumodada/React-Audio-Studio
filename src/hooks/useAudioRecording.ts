import { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Recorder from 'recorder-core';
// @ts-ignore
import 'recorder-core/src/engine/wav';

export interface UseAudioRecordingOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface SimpleRecordingState {
  isRecording: boolean;
  isReady: boolean;
  duration: number;
  isGettingPermission: boolean;
}

export const useAudioRecording = (options: UseAudioRecordingOptions = {}) => {
  const { onError, onSuccess } = options;
  
  const [recordingState, setRecordingState] = useState<SimpleRecordingState>({
    isRecording: false,
    isReady: false,
    duration: 0,
    isGettingPermission: false,
  });
  
  const recorderRef = useRef<any>(null);
  const recordingWaveRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateRecordingState = useCallback((updates: Partial<SimpleRecordingState>) => {
    setRecordingState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanupRecorder = useCallback(() => {
    if (recorderRef.current) {
      try {
        recorderRef.current.close();
      } catch (e) {
        console.warn('清理录音器时出错:', e);
      }
      recorderRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const getRecorderPermission = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        cleanupRecorder();
        
        const rec = Recorder({
          type: 'wav',
          sampleRate: 44100,
          bitRate: 16,
        });

        rec.open(
          function() {
            updateRecordingState({ isReady: true });
            recorderRef.current = rec;
            onSuccess?.('录音权限获取成功');
            resolve(true);
          },
          function(msg: string, isUserNotAllow: boolean) {
            const errorMsg = (isUserNotAllow ? "用户拒绝，" : "") + "无法录音:" + msg;
            onError?.(errorMsg);
            updateRecordingState({ isReady: false });
            resolve(false);
          }
        );
      } catch (error) {
        onError?.('录音器初始化失败');
        resolve(false);
      }
    });
  }, [cleanupRecorder, updateRecordingState, onError, onSuccess]);

  const startRecording = useCallback(async (onClearAudio: () => void) => {
    if (recordingState.isRecording || recordingState.isGettingPermission) {
      return;
    }

    onClearAudio();

    if (!recordingState.isReady || !recorderRef.current) {
      updateRecordingState({ isGettingPermission: true });
      const permissionGranted = await getRecorderPermission();
      updateRecordingState({ isGettingPermission: false });
      
      if (!permissionGranted) {
        return;
      }
    }

    try {
      recorderRef.current.start();
      updateRecordingState({ isRecording: true, duration: 0 });
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error) {
      onError?.('开始录音失败');
      updateRecordingState({ isRecording: false });
    }
  }, [recordingState.isRecording, recordingState.isGettingPermission, recordingState.isReady, getRecorderPermission, updateRecordingState, onError]);

  const stopRecording = useCallback((onAudioGenerated: (url: string) => void) => {
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
              duration: 0,
              isReady: false
            });
            
            cleanupRecorder();
            onSuccess?.('录音完成');
            
          } catch (error) {
            onError?.('处理录音结果失败');
          }
        },
        function(msg: string) {
          onError?.("录音失败:" + msg);
          updateRecordingState({
            isRecording: false,
            duration: 0,
            isReady: false
          });
          cleanupRecorder();
        }
      );
    } catch (error) {
      onError?.('停止录音失败');
    }
  }, [recordingState.isRecording, cleanupRecorder, updateRecordingState, onError, onSuccess]);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecorder();
    };
  }, [cleanupRecorder]);

  return {
    isRecording: recordingState.isRecording,
    isGettingPermission: recordingState.isGettingPermission,
    isRecordingReady: recordingState.isReady,
    recordingDuration: recordingState.duration,
    startRecording,
    stopRecording,
    formatRecordingTime,
    recordingWaveRef,
  };
}; 