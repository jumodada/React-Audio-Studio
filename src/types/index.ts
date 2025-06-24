// 音频格式类型
export type AudioFormat = 'wav' | 'mp3' | 'opus' | 'flac';

// 采样率类型
export type SampleRate = '8kHz' | '16kHz' | '22.05kHz' | '44.1kHz' | '48kHz' | '96kHz';

// 比特率类型
export type BitRate = '64' | '128' | '160' | '192' | '256' | '320' | '16' | '24' | '32';

// 音频预设配置
export interface AudioPreset {
  outputFormat: AudioFormat;
  sampleRate: SampleRate;
  bitRate: BitRate;
  clarity: number;
  volumeGain: number;
  reverb: number;
  decayTime: number;
  stereoWidth: number;
  noiseReduction: number;
  lowFreq: number;
  midFreq: number;
  highFreq: number;
  bassBoost: number;
  voiceMidFreq: number;
  highFreqSmooth: number;
  lowFreqClear: number;
}

// 音频处理参数
export interface AudioProcessingParams {
  outputFormat: AudioFormat;
  sampleRate: SampleRate;
  bitRate: BitRate;
  clarity: number;
  volumeGain: number;
  reverb: number;
  decayTime: number;
  stereoWidth: number;
  noiseReduction: number;
  lowFreq: number;
  midFreq: number;
  highFreq: number;
  bassBoost: number;
  voiceMidFreq: number;
  highFreqSmooth: number;
  lowFreqClear: number;
}

// 音频分段类型
export interface AudioSegment {
  startTime: number;
  endTime: number;
}

// 设备音频能力
export interface DeviceAudioCapabilities {
  maxSampleRate: number;
  supportedFormats: AudioFormat[];
  deviceInfo: {
    audioContext: boolean;
    webAudio: boolean;
    mediaRecorder: boolean;
  };
}

// 录音状态
export interface RecordingState {
  isRecording: boolean;
  isRecordingReady: boolean;
  recordingDuration: number;
  isGettingPermission: boolean;
}

// 音频播放状态
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
}

// 回调函数类型
export type AudioGeneratedCallback = (url: string) => void;
export type AudioClearCallback = () => void;
export type RecordingStateChangeCallback = (isRecording: boolean) => void;
export type SegmentChangeCallback = (segment: AudioSegment | null) => void;
export type AudioSubmitCallback = (blob: Blob, format: AudioFormat, bitRate: string) => void; 