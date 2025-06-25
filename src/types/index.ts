// 音频格式类型
export type AudioFormat = 'WAV' | 'OPUS' | 'MP3';

// 采样率类型
export type SampleRate = '22.05kHz' | '44.1kHz' | '48kHz' | '96kHz';

// 比特率类型
export type BitRate = '32' | '64' | '128' | '160' | '192' | '256' | '320';

// 音频处理参数
export interface AudioProcessingParams {
  outputFormat: AudioFormat;
  sampleRate: SampleRate;
  bitRate: BitRate;
  clarity: number;                 // 清晰度 0-100
  volumeGain: number;             // 音量增益 0-100
  reverb: number;                 // 混响 0-100
  decayTime: number;              // 衰减时间 0-100
  stereoWidth: number;            // 立体声宽度 0-100
  noiseReduction: number;         // 降噪 0-100
  lowFreq: number;                // 低频均衡 -20到+20
  midFreq: number;                // 中频均衡 -20到+20
  highFreq: number;               // 高频均衡 -20到+20
  bassBoost: number;              // 低音增强 0-100
  voiceMidFreq: number;           // 人声清晰度 0-100
  highFreqSmooth: number;         // 高频舒适度 0-100
  lowFreqClear: number;           // 低频通透感 0-100
}

// 音频预设类型
export type AudioPreset = 'standard' | 'recommended' | 'highest' | 'custom';

// 音频预设配置
export interface AudioPresetConfig extends AudioProcessingParams {}

// 音频片段选择
export interface AudioSegment {
  startTime: number;
  endTime: number;
  editable?: boolean;
  color?: string;
  labelText?: string;
  id?: string;
}

// 录音状态
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl?: string;
  audioBlob?: Blob;
}

// 音频播放状态
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  selectedSegment: AudioSegment | null;
}

// 调音 Hook 返回类型
export interface ToneTuningResult {
  params: AudioProcessingParams;
  isProcessing: boolean;
  updateParams: (newParams: Partial<AudioProcessingParams>) => void;
  resetParams: () => void;
  applyPreset: (preset: AudioPreset) => void;
  exportAudio: (format?: AudioFormat) => Promise<Blob | null>;
  processAudio: (paramsToProcess?: AudioProcessingParams) => Promise<string | null>;
  presetConfigs: Record<AudioPreset, AudioProcessingParams>;
}

// 录音 Hook 返回类型
export interface AudioRecorderResult {
  recordingState: RecordingState;
  isRecordingReady: boolean;
  isGettingPermission: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

// 音频播放 Hook 返回类型
export interface AudioPlayerResult {
  playerState: AudioPlayerState;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  selectSegment: (segment: AudioSegment | null) => void;
  playSegment: (segment: AudioSegment) => void;
}

// 音频处理 Hook 返回类型
export interface AudioProcessingResult {
  params: AudioProcessingParams;
  setParams: (params: Partial<AudioProcessingParams>) => void;
  resetParams: () => void;
  applyPreset: (preset: AudioPreset) => void;
  processAudio: (audioUrl: string, segment?: AudioSegment) => Promise<Blob | null>;
}

// 组件 Props 类型
export interface AudioRecorderProps {
  onRecordingComplete?: (audioUrl: string, audioBlob: Blob) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  onError?: (error: RecordingError) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface AudioTunerProps {
  audioUrl: string;
  initialParams?: Partial<AudioProcessingParams>;
  onAudioChange?: (audioUrl: string) => void;
  onParamsChange?: (params: AudioProcessingParams) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface AudioWaveformProps {
  audioUrl: string;
  height?: number;
  onSegmentSelect?: (segment: AudioSegment | null) => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

// 错误类型
export class AudioProcessingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

export class RecordingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RecordingError';
  }
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

// 回调函数类型
export type AudioGeneratedCallback = (url: string) => void;
export type AudioClearCallback = () => void;
export type RecordingStateChangeCallback = (isRecording: boolean) => void;
export type SegmentChangeCallback = (segment: AudioSegment | null) => void;
export type AudioSubmitCallback = (blob: Blob, format: AudioFormat, bitRate: string) => void; 