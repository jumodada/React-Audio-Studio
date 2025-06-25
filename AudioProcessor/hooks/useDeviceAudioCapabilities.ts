import { useState, useEffect } from 'react';

interface AudioCapabilities {
  maxSampleRate: number | null;
  isLoading: boolean;
  error: string | null;
  deviceInfo?: {
    channelCount: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
}

export const useDeviceAudioCapabilities = () => {
  const [capabilities, setCapabilities] = useState<AudioCapabilities>({
    maxSampleRate: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectAudioCapabilities = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('浏览器不支持音频录制');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: { ideal: 192000 },
            channelCount: { ideal: 2 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const track = stream.getAudioTracks()[0];
        const settings = track.getSettings();
        const capabilities = track.getCapabilities();
        
        const actualSampleRate = settings.sampleRate || 44100;
        const maxSupportedRate = capabilities.sampleRate?.max || actualSampleRate;
        
        const deviceInfo = {
          channelCount: settings.channelCount || 1,
          echoCancellation: settings.echoCancellation || false,
          noiseSuppression: settings.noiseSuppression || false,
          autoGainControl: settings.autoGainControl || false,
        };

        stream.getTracks().forEach(track => track.stop());
        
        setCapabilities({
          maxSampleRate: maxSupportedRate,
          deviceInfo,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        setCapabilities({
          maxSampleRate: 48000,
          deviceInfo: {
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          isLoading: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    };

    detectAudioCapabilities();
  }, []);

  // 格式化采样率显示
  const formatSampleRate = (rate: number | null) => {
    if (!rate) return '未知';
    if (rate >= 1000) {
      return `${(rate / 1000).toFixed(1)}kHz`;
    }
    return `${rate}Hz`;
  };

  const isSampleRateSupported = (targetRate: number) => {
    return capabilities.maxSampleRate ? targetRate <= capabilities.maxSampleRate : false;
  };

  const getRecommendedVoiceSampleRate = () => {
    if (!capabilities.maxSampleRate) return 44100;
    
    const voiceRates = [48000, 44100, 96000, 192000];
    
    return voiceRates.find(rate => rate <= capabilities.maxSampleRate!) || 44100;
  };

  return {
    ...capabilities,
    formatSampleRate,
    isSampleRateSupported,
    getRecommendedVoiceSampleRate,
  };
}; 