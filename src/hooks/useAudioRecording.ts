import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';

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
  
  const { recordingState, startRecording: start, stopRecording: stop } = useAudioRecorder();
  const recordingWaveRef = useRef<HTMLDivElement>(null);
  
  const [legacyState, setLegacyState] = useState<SimpleRecordingState>({
    isRecording: false,
    isReady: true,
    duration: 0,
    isGettingPermission: false,
  });

  // 同步状态
  useEffect(() => {
    setLegacyState({
      isRecording: recordingState.isRecording,
      isReady: !recordingState.isRecording,
      duration: recordingState.duration,
      isGettingPermission: false,
    });
  }, [recordingState]);

  const startRecording = useCallback(async (onClearAudio?: () => void) => {
    try {
      onClearAudio?.();
      await start();
      onSuccess?.('录音开始');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '录音失败';
      onError?.(errorMsg);
    }
  }, [start, onError, onSuccess]);

  const stopRecording = useCallback(async (onAudioGenerated?: (url: string) => void) => {
    try {
      await stop();
      if (recordingState.audioUrl) {
        onAudioGenerated?.(recordingState.audioUrl);
      }
      onSuccess?.('录音完成');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '停止录音失败';
      onError?.(errorMsg);
    }
  }, [stop, recordingState.audioUrl, onError, onSuccess]);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording: legacyState.isRecording,
    isGettingPermission: legacyState.isGettingPermission,
    isRecordingReady: legacyState.isReady,
    recordingDuration: legacyState.duration,
    startRecording,
    stopRecording,
    formatRecordingTime,
    recordingWaveRef,
  };
}; 