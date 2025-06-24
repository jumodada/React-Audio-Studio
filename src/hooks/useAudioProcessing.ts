import { useCallback, useState } from 'react';
import { AudioProcessingParams, AudioPreset } from '../types';

const presetConfigs: Record<string, AudioPreset> = {
  standard: {
    outputFormat: 'opus',
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
    outputFormat: 'opus',
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
    outputFormat: 'wav',
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
  }
};

const defaultParams: AudioProcessingParams = {
  outputFormat: 'wav',
  sampleRate: '96kHz',
  bitRate: '32',
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
};

const ensureSafeAudioParam = (value: any, defaultValue: number = 0): number => {
  const numValue = Number(value);
  return isFinite(numValue) ? numValue : defaultValue;
};

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer2 = new ArrayBuffer(44 + length);
  const view = new DataView(buffer2);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

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

export interface UseAudioProcessingOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const useAudioProcessing = (options: UseAudioProcessingOptions = {}) => {
  const { onError, onSuccess } = options;
  
  const [params, setParams] = useState<AudioProcessingParams>(defaultParams);

  const updateParams = useCallback((updates: Partial<AudioProcessingParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = presetConfigs[presetName];
    if (preset) {
      setParams(preset);
    }
  }, []);

  const resetParams = useCallback(() => {
    setParams(defaultParams);
  }, []);

  const createReverbImpulse = useCallback((audioContext: AudioContext | OfflineAudioContext, reverbAmount: number, decay: number) => {
    reverbAmount = ensureSafeAudioParam(reverbAmount, 0);
    decay = ensureSafeAudioParam(decay, 50);
    
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * (decay / 1000) * 4;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2) * (reverbAmount / 100);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2) * (reverbAmount / 100);
    }
    
    return impulse;
  }, []);

  const processAudio = useCallback(async (audioUrl: string, segment?: { startTime: number; endTime: number }): Promise<Blob> => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      let processBuffer = audioBuffer;
      if (segment) {
        const startSample = Math.floor(segment.startTime * audioBuffer.sampleRate);
        const endSample = Math.floor(segment.endTime * audioBuffer.sampleRate);
        const segmentLength = endSample - startSample;
        
        if (segmentLength > 0) {
          processBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            segmentLength,
            audioBuffer.sampleRate
          );
          
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const segmentData = processBuffer.getChannelData(channel);
            for (let i = 0; i < segmentLength; i++) {
              segmentData[i] = channelData[startSample + i];
            }
          }
        }
      }
      
      const offlineContext = new OfflineAudioContext(
        processBuffer.numberOfChannels,
        processBuffer.length,
        processBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = processBuffer;
      
      let currentNode: AudioNode = source;
      
      
      currentNode.connect(offlineContext.destination);
      source.start(0);
      
      const renderedBuffer = await offlineContext.startRendering();
      
      let resultBlob: Blob;
      if (params.outputFormat === 'wav') {
        const wavArrayBuffer = audioBufferToWav(renderedBuffer);
        resultBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      } else {
        const wavArrayBuffer = audioBufferToWav(renderedBuffer);
        resultBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      }
      
      audioContext.close();
      
      onSuccess?.('音频处理完成');
      return resultBlob;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '音频处理失败';
      onError?.(errorMsg);
      throw error;
    }
  }, [params, createReverbImpulse, onError, onSuccess]);

  return {
    params,
    updateParams,
    applyPreset,
    resetParams,
    processAudio,
    presetOptions: Object.keys(presetConfigs),
    defaultParams,
  };
}; 