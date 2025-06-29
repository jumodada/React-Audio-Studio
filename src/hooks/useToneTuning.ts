import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  AudioProcessingParams, 
  ToneTuningResult, 
  AudioFormat, 
  AudioPreset,
  AudioProcessingError 
} from '../types';

const presetConfigs: Record<AudioPreset, AudioProcessingParams> = {
  standard: {
    outputFormat: 'OPUS',
    sampleRate: '44.1kHz',
    bitRate: '128',
    clarity: 60,
    volumeGain: 55,
    reverb: 0,
    decayTime: 20,
    stereoWidth: 30,
    noiseReduction: 40,
    lowFreq: -8,
    midFreq: 2,
    highFreq: 4,
    bassBoost: 15,
    voiceMidFreq: 50,
    highFreqSmooth: 50,
    lowFreqClear: 50,
  },
  recommended: {
    outputFormat: 'OPUS',
    sampleRate: '96kHz',
    bitRate: '160',
    clarity: 85,
    volumeGain: 95,
    reverb: 0,
    decayTime: 15,
    stereoWidth: 25,
    noiseReduction: 20,
    lowFreq: -10,
    midFreq: 0,
    highFreq: 6,
    bassBoost: 25,
    voiceMidFreq: 60,
    highFreqSmooth: 45,
    lowFreqClear: 55,
  },
  highest: {
    outputFormat: 'WAV',
    sampleRate: '96kHz',
    bitRate: '32',
    clarity: 75,
    volumeGain: 85,
    reverb: 0,
    decayTime: 15,
    stereoWidth: 45,
    noiseReduction: 40,
    lowFreq: -5,
    midFreq: 4,
    highFreq: 2,
    bassBoost: 30,
    voiceMidFreq: 75,
    highFreqSmooth: 70,
    lowFreqClear: 65,
  },
  custom: {
    outputFormat: 'WAV',
    sampleRate: '44.1kHz',
    bitRate: '160',
    clarity: 0,
    volumeGain: 50,
    reverb: 0,
    decayTime: 50,
    stereoWidth: 50,
    noiseReduction: 0,
    lowFreq: 0,
    midFreq: 0,
    highFreq: 0,
    bassBoost: 0,
    voiceMidFreq: 50,
    highFreqSmooth: 50,
    lowFreqClear: 50,
  }
};

const ensureSafeAudioParam = (value: any, defaultValue: number = 0): number => {
  const numValue = Number(value);
  return isFinite(numValue) ? numValue : defaultValue;
};

const createReverbImpulse = (audioContext: AudioContext | OfflineAudioContext, reverbAmount: number, decay: number): AudioBuffer => {
  const baseLength = audioContext.sampleRate * 2;
  const decayMultiplier = decay / 50;
  const length = baseLength * (0.5 + decayMultiplier);
  const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const decayFactor = Math.pow(1 - i / length, 1 + decay / 100);
      channelData[i] = (Math.random() * 2 - 1) * decayFactor * (reverbAmount / 100);
    }
  }

  return impulse;
};

const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer2 = new ArrayBuffer(44 + length);
  const view = new DataView(buffer2);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };
  
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // 文件长度
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // 长度 = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length); // chunk length

  // 写入音频数据
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  pos = 44;
  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos - 44]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return buffer2;
};

export interface ToneTuningOptions {
  onAudioChange?: (audioUrl: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  onError?: (error: AudioProcessingError) => void;
}

export const useToneTuning = (
  audioSource?: string | File | Blob,
  initialParams?: Partial<AudioProcessingParams>,
  options: ToneTuningOptions = {}
): ToneTuningResult => {
  const [params, setParams] = useState<AudioProcessingParams>(() => ({
    ...presetConfigs.recommended,
    ...initialParams
  }));
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingPromiseRef = useRef<Promise<string | void> | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  const { onAudioChange, onProcessingChange, onError } = options;

  const initializeAudio = useCallback(async () => {
    if (!audioSource) {
      return;
    }

    try {
      let audioUrl: string;
      
      if (typeof audioSource === 'string') {
        audioUrl = audioSource;
      } else {
        if (sourceUrlRef.current) {
          URL.revokeObjectURL(sourceUrlRef.current);
        }
        audioUrl = URL.createObjectURL(audioSource);
        sourceUrlRef.current = audioUrl;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
    } catch (error) {
      console.error('音频初始化失败:', error);
      const processingError = new AudioProcessingError('音频初始化失败');
      onError?.(processingError);
      throw processingError;
    }
  }, [audioSource, onError]);

  const processAudioWithEffects = useCallback(async (audioBuffer: AudioBuffer, currentParams: AudioProcessingParams): Promise<AudioBuffer> => {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = offlineContext.createGain();
    const lowFilter = offlineContext.createBiquadFilter();
    const midFilter = offlineContext.createBiquadFilter();
    const highFilter = offlineContext.createBiquadFilter();
    const clarityFilter = offlineContext.createBiquadFilter();
    const compressor = offlineContext.createDynamicsCompressor();
    const convolver = offlineContext.createConvolver();

    // 配置增益
    gainNode.gain.value = ensureSafeAudioParam(currentParams.volumeGain / 50, 1);

    // 配置均衡器
    lowFilter.type = 'peaking';
    lowFilter.frequency.value = 150;
    lowFilter.Q.value = 1;
    lowFilter.gain.value = ensureSafeAudioParam(currentParams.lowFreq, 0);

    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    midFilter.gain.value = ensureSafeAudioParam(currentParams.midFreq, 0);

    highFilter.type = 'peaking';
    highFilter.frequency.value = 8000;
    highFilter.Q.value = 1;
    highFilter.gain.value = ensureSafeAudioParam(currentParams.highFreq, 0);

    clarityFilter.type = 'highshelf';
    clarityFilter.frequency.value = 6000;
    clarityFilter.gain.value = ensureSafeAudioParam(currentParams.clarity * 0.2, 0);

    compressor.ratio.value = ensureSafeAudioParam(1 + (currentParams.bassBoost / 100) * 12, 1);

    source.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(clarityFilter);
    clarityFilter.connect(compressor);
    compressor.connect(gainNode);

    if (currentParams.reverb > 0) {
      const dryGain = offlineContext.createGain();
      const wetGain = offlineContext.createGain();
      const merger = offlineContext.createChannelMerger(2);

      dryGain.gain.value = 1 - (currentParams.reverb / 100);
      wetGain.gain.value = currentParams.reverb / 100;

      convolver.buffer = createReverbImpulse(offlineContext, currentParams.reverb, currentParams.decayTime);

      gainNode.connect(dryGain);
      dryGain.connect(merger, 0, 0);
      dryGain.connect(merger, 0, 1);

      gainNode.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(merger, 0, 0);
      wetGain.connect(merger, 0, 1);

      merger.connect(offlineContext.destination);
    } else {
      gainNode.connect(offlineContext.destination);
    }

    source.start();
    return await offlineContext.startRendering();
  }, []);

  // 手动处理音频函数
  const processAudio = useCallback(async (paramsToProcess?: AudioProcessingParams): Promise<string | null> => {
    if (!audioBufferRef.current || !audioContextRef.current) {
      return null;
    }

    const currentParams = paramsToProcess || params;

    // 如果已有处理任务在进行，等待其完成
    if (processingPromiseRef.current) {
      await processingPromiseRef.current;
    }

    setIsProcessing(true);
    onProcessingChange?.(true);
    
    const processingPromise = (async () => {
      try {
        const processedBuffer = await processAudioWithEffects(audioBufferRef.current!, currentParams);
        
        let blob: Blob;
        if (currentParams.outputFormat === 'WAV') {
          const wav = audioBufferToWav(processedBuffer);
          blob = new Blob([wav], { type: 'audio/wav' });
        } else {
          const wav = audioBufferToWav(processedBuffer);
          blob = new Blob([wav], { type: 'audio/wav' });
        }

        // 清理之前的音频URL
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        }

        const audioUrl = URL.createObjectURL(blob);
        currentAudioUrlRef.current = audioUrl;
        
        // 通知音频变化
        onAudioChange?.(audioUrl);
        
        return audioUrl;
        
      } catch (error) {
        console.error('音频处理失败:', error);
        const processingError = new AudioProcessingError('音频处理失败');
        onError?.(processingError);
        throw processingError;
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
          onProcessingChange?.(false);
        }, 500);
      }
    })();

    processingPromiseRef.current = processingPromise;
    const result = await processingPromise;
    processingPromiseRef.current = null;
    
    return result;
  }, [params, processAudioWithEffects, onAudioChange, onProcessingChange, onError]);

  // 防抖处理音频
  const debouncedProcessAudio = useCallback((paramsToProcess?: AudioProcessingParams) => {
    if (!audioBufferRef.current) {
      return;
    }

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 防抖处理：300ms 后执行处理
    debounceTimerRef.current = setTimeout(() => {
      processAudio(paramsToProcess);
    }, 300);
  }, [processAudio]);

  // 音频源变化时重新初始化
  useEffect(() => {
    if (!audioSource) {
      return;
    }

    initializeAudio()
      .then(() => {
        // 初始化完成后，不自动处理音频，等待用户调用
      })
      .catch(error => {
        console.error('音频初始化失败:', error);
        setIsProcessing(false);
        onProcessingChange?.(false);
      });
    
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
        sourceUrlRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      audioBufferRef.current = null;
    };
  }, [audioSource, initializeAudio, onProcessingChange]);

  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateParams = useCallback((newParams: Partial<AudioProcessingParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
    // 参数更新时自动触发防抖处理
    debouncedProcessAudio({ ...params, ...newParams });
  }, [params, debouncedProcessAudio]);

  const resetParams = useCallback(() => {
    const resetToParams = presetConfigs.recommended;
    setParams(resetToParams);
    debouncedProcessAudio(resetToParams);
  }, [debouncedProcessAudio]);

  const applyPreset = useCallback((preset: AudioPreset) => {
    const presetParams = presetConfigs[preset];
    setParams(presetParams);
    debouncedProcessAudio(presetParams);
  }, [debouncedProcessAudio]);

  const exportAudio = useCallback(async (format: AudioFormat = params.outputFormat): Promise<Blob | null> => {
    if (!audioBufferRef.current || !audioContextRef.current) {
      return null;
    }

    try {
      const processedBuffer = await processAudioWithEffects(audioBufferRef.current, params);
      
      if (format === 'WAV') {
        const wav = audioBufferToWav(processedBuffer);
        return new Blob([wav], { type: 'audio/wav' });
      } else {
        const wav = audioBufferToWav(processedBuffer);
        return new Blob([wav], { type: 'audio/wav' });
      }
    } catch (error) {
      console.error('音频导出失败:', error);
      return null;
    }
  }, [params, processAudioWithEffects]);

  return {
    params,
    isProcessing,
    updateParams,
    resetParams,
    applyPreset,
    exportAudio,
    processAudio,  // 手动处理音频
    presetConfigs
  };
}; 