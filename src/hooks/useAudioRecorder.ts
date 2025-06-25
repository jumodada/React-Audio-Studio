import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, AudioRecorderResult, RecordingError } from '../types';

import Recorder from 'recorder-core';
import 'recorder-core/src/engine/wav';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';

export interface AudioRecorderOptions {
  onRecordingComplete?: (url: string, blob: Blob) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  onError?: (error: RecordingError) => void;
}

export const useAudioRecorder = (options: AudioRecorderOptions = {}): AudioRecorderResult => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: undefined,
    audioBlob: undefined
  });

  const [isRecordingReady, setIsRecordingReady] = useState(false);
  const [isGettingPermission, setIsGettingPermission] = useState(false);
  
  const recorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const { onRecordingComplete, onRecordingStateChange, onError } = options;

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const updateDuration = useCallback(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - startTimeRef.current - pausedDurationRef.current) / 1000);
      setRecordingState(prev => {
        const newState = { ...prev, duration };
        onRecordingStateChange?.(newState);
        return newState;
      });
    }
  }, [recordingState.isRecording, recordingState.isPaused, onRecordingStateChange]);

  const getRecorderPermission = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
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

        const rec = Recorder({
          type: 'wav',
          sampleRate: 44100,
          bitRate: 16,
          onProcess: (_buffers: any, _powerLevel: number, _bufferDuration: number, _bufferSampleRate: number) => {
            // 可以在这里处理实时音频数据，比如显示音量等级
          }
        });

        rec.open(
          () => {
            // 成功回调
            setIsRecordingReady(true);
            recorderRef.current = rec;
            resolve(true);
          }, 
          (msg: string, isUserNotAllow: boolean) => {
            // 错误回调
            console.log((isUserNotAllow ? "UserNotAllow，" : "") + "无法录音:" + msg);
            setIsRecordingReady(false);
            const error = new RecordingError(
              isUserNotAllow ? '麦克风权限被拒绝' : '录音器初始化失败', 
              isUserNotAllow ? 'PERMISSION_DENIED' : 'RECORDER_INIT_FAILED'
            );
            onError?.(error);
            resolve(false);
          }
        );
      } catch (error) {
        console.error('录音器初始化失败:', error);
        const recordingError = new RecordingError('录音器初始化失败', 'RECORDER_INIT_FAILED');
        onError?.(recordingError);
        resolve(false);
      }
    });
  }, [onError]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      if (recordingState.isRecording || isGettingPermission) {
        return;
      }

      // 获取录音权限
      if (!isRecordingReady || !recorderRef.current) {
        setIsGettingPermission(true);
        const permissionGranted = await getRecorderPermission();
        setIsGettingPermission(false);
        
        if (!permissionGranted) {
          return;
        }
      }

      if (!recorderRef.current) {
        throw new RecordingError('录音器未初始化', 'RECORDER_NOT_INITIALIZED');
      }

      recorderRef.current.start();
      
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      
      const newState = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUrl: undefined,
        audioBlob: undefined
      };
      setRecordingState(newState);
      onRecordingStateChange?.(newState);

      durationTimerRef.current = setInterval(updateDuration, 1000);

    } catch (error) {
      console.error('开始录音失败:', error);
      
      let recordingError: RecordingError;
      if (error instanceof RecordingError) {
        recordingError = error;
      } else if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          recordingError = new RecordingError('麦克风权限被拒绝', 'PERMISSION_DENIED');
        } else if (error.name === 'NotFoundError') {
          recordingError = new RecordingError('未找到麦克风设备', 'NO_MICROPHONE');
        } else {
          recordingError = new RecordingError(`录音失败: ${error.message}`, 'UNKNOWN_ERROR');
        }
      } else {
        recordingError = new RecordingError('录音失败：未知错误', 'UNKNOWN_ERROR');
      }
      
      onError?.(recordingError);
      throw recordingError;
    }
  }, [recordingState.isRecording, isGettingPermission, isRecordingReady, getRecorderPermission, updateDuration, onRecordingStateChange, onError]);

  const stopRecording = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!recorderRef.current || !recordingState.isRecording) {
          resolve();
          return;
        }

        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        recorderRef.current.stop(
          (blob: Blob, duration: number) => {
            try {
              const audioUrl = URL.createObjectURL(blob);
              
              const newState = {
                isRecording: false,
                isPaused: false,
                audioUrl,
                audioBlob: blob,
                duration: Math.floor(duration / 1000)
              };
              setRecordingState(newState);
              onRecordingStateChange?.(newState);

              clearDurationTimer();

              recorderRef.current.close();
              recorderRef.current = null;
              setIsRecordingReady(false);

              // 通知录音完成
              onRecordingComplete?.(audioUrl, blob);

              resolve();
            } catch (error) {
              console.error('停止录音时处理音频失败:', error);
              const recordingError = new RecordingError('停止录音时处理音频失败', 'AUDIO_PROCESSING_FAILED');
              onError?.(recordingError);
              reject(recordingError);
            }
          }, 
          (msg: string) => {
            console.log("录音失败:" + msg);
            const recordingError = new RecordingError(`录音失败: ${msg}`, 'STOP_RECORDING_FAILED');
            onError?.(recordingError);
            
            setRecordingState(prev => {
              const newState = { ...prev, isRecording: false, isPaused: false, duration: 0 };
              onRecordingStateChange?.(newState);
              return newState;
            });
            
            if (recorderRef.current) {
              try {
                recorderRef.current.close();
              } catch (e) {
                console.warn('清理录音器时出错:', e);
              }
              recorderRef.current = null;
            }
            setIsRecordingReady(false);
            
            reject(recordingError);
          }
        );

      } catch (error) {
        console.error('停止录音异常:', error);
        const recordingError = new RecordingError('停止录音异常', 'STOP_RECORDING_EXCEPTION');
        onError?.(recordingError);
        reject(recordingError);
      }
    });
  }, [recordingState.isRecording, clearDurationTimer, onRecordingComplete, onRecordingStateChange, onError]);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && recordingState.isRecording && !recordingState.isPaused) {
      recorderRef.current.pause();
      
      const pauseTime = Date.now();
      const currentDuration = pauseTime - startTimeRef.current - pausedDurationRef.current;
      
      const newState = {
        ...recordingState,
        isPaused: true,
        duration: Math.floor(currentDuration / 1000)
      };
      setRecordingState(newState);
      onRecordingStateChange?.(newState);

      clearDurationTimer();
    }
  }, [recordingState, clearDurationTimer, onRecordingStateChange]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && recordingState.isRecording && recordingState.isPaused) {
      recorderRef.current.resume();
      
      const resumeTime = Date.now();
      const lastPauseDuration = resumeTime - startTimeRef.current - pausedDurationRef.current;
      pausedDurationRef.current += lastPauseDuration - (recordingState.duration * 1000);
      
      const newState = {
        ...recordingState,
        isPaused: false
      };
      setRecordingState(newState);
      onRecordingStateChange?.(newState);

      durationTimerRef.current = setInterval(updateDuration, 1000);
    }
  }, [recordingState, updateDuration, onRecordingStateChange]);

  const clearRecording = useCallback(() => {
    if (recordingState.isRecording) {
      if (recorderRef.current) {
        recorderRef.current.close();
        recorderRef.current = null;
      }
    }

    clearDurationTimer();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }

    const newState = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: undefined,
      audioBlob: undefined
    };
    setRecordingState(newState);
    onRecordingStateChange?.(newState);

    startTimeRef.current = 0;
    pausedDurationRef.current = 0;
    setIsRecordingReady(false);
    setIsGettingPermission(false);
  }, [recordingState, clearDurationTimer, onRecordingStateChange]);

  useEffect(() => {
    return () => {
      clearRecording();
    };
  }, []);

  return {
    recordingState,
    isRecordingReady,
    isGettingPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  };
}; 