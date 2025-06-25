// 音频播放相关
export { useAudioPlayer } from './useAudioPlayer';
export type { AudioPlayerResult } from '../types';

// 音频录制相关
export { useAudioRecording } from './useAudioRecording';
export { useAudioRecorder } from './useAudioRecorder';
export type { AudioRecorderResult, RecordingState } from '../types';

// 音频处理相关
export { useAudioProcessing } from './useAudioProcessing';
export type { AudioProcessingResult, AudioProcessingParams } from '../types';

// 调音相关 - 核心功能
export { useToneTuning } from './useToneTuning';
export type { ToneTuningResult } from '../types';

// 设备能力检测
export { useDeviceAudioCapabilities } from './useDeviceAudioCapabilities';

 