import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState, AudioRecorderResult, RecordingError } from '../types';

import Recorder from 'recorder-core';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';

export const useAudioRecorder = (): AudioRecorderResult => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: undefined,
    audioBlob: undefined
  });

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

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
      setRecordingState(prev => ({ ...prev, duration }));
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new RecordingError('浏览器不支持录音功能', 'BROWSER_NOT_SUPPORTED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      recorderRef.current = Recorder({
        type: 'wav',
        sampleRate: 44100,
        bitRate: 16,
        onProcess: (_buffers: any, _powerLevel: number, _bufferDuration: number, _bufferSampleRate: number) => {
          // 可以在这里处理实时音频数据，比如显示音量等级
        }
      });

      recorderRef.current.open(stream, () => {
        recorderRef.current.start();
        
        startTimeRef.current = Date.now();
        pausedDurationRef.current = 0;
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          isPaused: false,
          duration: 0,
          audioUrl: undefined,
          audioBlob: undefined
        }));

        durationTimerRef.current = setInterval(updateDuration, 1000);
      }, (error: any) => {
        console.error('录音器初始化失败:', error);
        throw new RecordingError('录音器初始化失败', 'RECORDER_INIT_FAILED');
      });

    } catch (error) {
      console.error('开始录音失败:', error);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (error instanceof RecordingError) {
        throw error;
      } else if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new RecordingError('麦克风权限被拒绝', 'PERMISSION_DENIED');
        } else if (error.name === 'NotFoundError') {
          throw new RecordingError('未找到麦克风设备', 'NO_MICROPHONE');
        } else {
          throw new RecordingError(`录音失败: ${error.message}`, 'UNKNOWN_ERROR');
        }
      } else {
        throw new RecordingError('录音失败：未知错误', 'UNKNOWN_ERROR');
      }
    }
  }, [updateDuration]);

  const stopRecording = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!recorderRef.current || !recordingState.isRecording) {
          resolve();
          return;
        }

        recorderRef.current.stop((blob: Blob, duration: number) => {
          try {
            const audioUrl = URL.createObjectURL(blob);
            
            setRecordingState(prev => ({
              ...prev,
              isRecording: false,
              isPaused: false,
              audioUrl,
              audioBlob: blob,
              duration: Math.floor(duration / 1000)
            }));

            clearDurationTimer();

            recorderRef.current.close();
            recorderRef.current = null;

            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }

            resolve();
          } catch (error) {
            console.error('停止录音时处理音频失败:', error);
            reject(new RecordingError('停止录音时处理音频失败', 'AUDIO_PROCESSING_FAILED'));
          }
        }, (error: any) => {
          console.error('停止录音失败:', error);
          reject(new RecordingError('停止录音失败', 'STOP_RECORDING_FAILED'));
        });

      } catch (error) {
        console.error('停止录音异常:', error);
        reject(new RecordingError('停止录音异常', 'STOP_RECORDING_EXCEPTION'));
      }
    });
  }, [recordingState.isRecording, clearDurationTimer]);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && recordingState.isRecording && !recordingState.isPaused) {
      recorderRef.current.pause();
      
      const pauseTime = Date.now();
      const currentDuration = pauseTime - startTimeRef.current - pausedDurationRef.current;
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: true,
        duration: Math.floor(currentDuration / 1000)
      }));

      clearDurationTimer();
    }
  }, [recordingState.isRecording, recordingState.isPaused, clearDurationTimer]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && recordingState.isRecording && recordingState.isPaused) {
      recorderRef.current.resume();
      
      const resumeTime = Date.now();
      const lastPauseDuration = resumeTime - startTimeRef.current - pausedDurationRef.current;
      pausedDurationRef.current += lastPauseDuration - (recordingState.duration * 1000);
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: false
      }));

      durationTimerRef.current = setInterval(updateDuration, 1000);
    }
  }, [recordingState.isRecording, recordingState.isPaused, recordingState.duration, updateDuration]);

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

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: undefined,
      audioBlob: undefined
    });

    startTimeRef.current = 0;
    pausedDurationRef.current = 0;
  }, [recordingState.isRecording, recordingState.audioUrl, clearDurationTimer]);

  useEffect(() => {
    return () => {
      clearRecording();
    };
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  };
}; 