import { useState, useEffect, useCallback } from 'react';
import { DeviceAudioCapabilities, AudioFormat } from '../types';

export const useDeviceAudioCapabilities = () => {
  const [capabilities, setCapabilities] = useState<DeviceAudioCapabilities>({
    maxSampleRate: 44100,
    supportedFormats: ['WAV'],
    deviceInfo: {
      audioContext: false,
      webAudio: false,
      mediaRecorder: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectAudioContext = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const context = new AudioContextClass();
        const maxSampleRate = context.sampleRate;
        context.close();
        return { supported: true, maxSampleRate };
      }
      return { supported: false, maxSampleRate: 44100 };
    } catch (error) {
      console.warn('AudioContext detection failed:', error);
      return { supported: false, maxSampleRate: 44100 };
    }
  }, []);

  const detectMediaRecorder = useCallback(() => {
    try {
      return typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function';
    } catch (error) {
      console.warn('MediaRecorder detection failed:', error);
      return false;
    }
  }, []);

  const detectSupportedFormats = useCallback((): AudioFormat[] => {
    const formats: AudioFormat[] = [];
    
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        formats.push('wav' as AudioFormat);
      }
      if (MediaRecorder.isTypeSupported('audio/mp3')) {
        formats.push('mp3' as AudioFormat);
      }
      if (MediaRecorder.isTypeSupported('audio/opus')) {
        formats.push('opus' as AudioFormat);
      }
      if (MediaRecorder.isTypeSupported('audio/flac')) {
        formats.push('flac' as AudioFormat);
      }
    }
    
    return formats.length > 0 ? formats : ['wav' as AudioFormat];
  }, []);

  const formatSampleRate = useCallback((sampleRate: number): string => {
    if (sampleRate >= 1000) {
      return `${(sampleRate / 1000).toFixed(1)}kHz`;
    }
    return `${sampleRate}Hz`;
  }, []);

  const detectCapabilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const audioContextResult = detectAudioContext();
      const mediaRecorderSupported = detectMediaRecorder();
      
      const supportedFormats = detectSupportedFormats();

      const newCapabilities: DeviceAudioCapabilities = {
        maxSampleRate: audioContextResult.maxSampleRate,
        supportedFormats,
        deviceInfo: {
          audioContext: audioContextResult.supported,
          webAudio: audioContextResult.supported,
          mediaRecorder: mediaRecorderSupported,
        },
      };

      setCapabilities(newCapabilities);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检测设备音频能力时发生未知错误';
      setError(errorMessage);
      console.error('Device audio capabilities detection failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [detectAudioContext, detectMediaRecorder, detectSupportedFormats]);

  useEffect(() => {
    detectCapabilities();
  }, [detectCapabilities]);

  return {
    ...capabilities,
    isLoading,
    error,
    formatSampleRate,
    refresh: detectCapabilities,
  };
}; 