// 🎵 React Audio Studio Core Library
// 一个现代化的React音频录制和处理工作台组件库

// === Hooks ===
// 核心功能 Hooks
export { useToneTuning } from './hooks/useToneTuning';
export { useAudioRecorder } from './hooks/useAudioRecorder';
export { useAudioPlayer } from './hooks/useAudioPlayer';

// 其他 Hooks
export { useAudioRecording } from './hooks/useAudioRecording';
export { useAudioProcessing } from './hooks/useAudioProcessing';
export { useDeviceAudioCapabilities } from './hooks/useDeviceAudioCapabilities';

// === Components ===
// 核心组件
export { AudioWaveform } from './components/AudioWaveform';
export { AudioRecorder } from './components/AudioRecorder';
export { AudioTuner } from './components/AudioTuner';

// === Types ===
// 主要类型
export type {
  // Hook 返回类型
  ToneTuningResult,
  AudioRecorderResult,
  AudioPlayerResult,
  AudioProcessingResult,
  
  // 状态类型
  RecordingState,
  AudioPlayerState,
  AudioSegment,
  
  // 参数类型
  AudioProcessingParams,
  AudioPreset,
  AudioFormat,
  SampleRate,
  BitRate,
  
  // 组件 Props 类型
  AudioWaveformProps,
  AudioRecorderProps,
  AudioTunerProps,
  
  // 错误类型
  AudioProcessingError,
  RecordingError
} from './types';

// 组件引用类型
export type { AudioWaveformRef } from './components/AudioWaveform';

// 主要版本信息
export const version = '0.1.0'; 