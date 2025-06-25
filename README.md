# 🎵 React Audio Studio

一个现代化的React音频录制和处理工作台组件库，提供专业级的音频录制、实时调音和波形显示功能。

[![npm version](https://badge.fury.io/js/@react-audio-studio/core.svg)](https://badge.fury.io/js/@react-audio-studio/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 📸 演示效果

![React Audio Studio 演示界面](https://i.postimg.cc/wMKDDvHs/image.png)

*专业音频录制与调音工作台界面*

## ✨ 特性

### 🎤 核心功能
- **音频录制** - 支持实时录音，录音过程可视化
- **音频播放** - 完整的音频播放控制和进度管理
- **音频处理** - 专业的音频后处理和参数调节
- **实时调音** - 参数调整时音频实时更新，无需等待
- **波形显示** - 基于peaks.js的专业波形可视化
- **音频片段选择** - 可视化选择和播放音频片段
- **多格式支持** - WAV、OPUS、MP3格式输出

### 🔧 专业调音功能
- **音质增强** - 清晰度、音量增益、降噪、低音增强
- **专业均衡器** - 低频/中频/高频独立调节
- **人声优化** - 人声清晰度、高频舒适度、低频通透感
- **空间效果** - 混响、衰减时间、立体声宽度调节

### 📱 设备能力
- **自动检测** - 检测设备支持的音频格式和采样率
- **兼容性** - 支持现代浏览器的Web Audio API
- **权限管理** - 智能的麦克风权限请求处理

## 🚀 快速开始

### 安装

```bash
npm install @react-audio-studio/core
# 或
yarn add @react-audio-studio/core
```

### 基础用法

#### 1. 音频录制Hook

```tsx
import { useAudioRecording } from '@react-audio-studio/core';

function RecordingApp() {
  const recording = useAudioRecording({
    onError: (error) => console.error('录音错误:', error),
    onSuccess: (msg) => console.log('录音成功:', msg),
  });

  const handleStart = () => {
    recording.startRecording(() => {
      console.log('开始录音...');
    });
  };

  const handleStop = () => {
    recording.stopRecording((audioUrl) => {
      console.log('录音完成，音频URL:', audioUrl);
    });
  };

  return (
    <div>
      {/* 录音波形显示容器 */}
      <div 
        ref={recording.recordingWaveRef} 
        style={{ height: '60px', background: '#f0f0f0' }}
      />
      
      <div>录音时长: {recording.formatRecordingTime(recording.recordingDuration)}</div>
      
      <button onClick={handleStart} disabled={recording.isRecording}>
        {recording.isGettingPermission ? '获取权限中...' : '开始录音'}
      </button>
      
      <button onClick={handleStop} disabled={!recording.isRecording}>
        停止录音
      </button>
    </div>
  );
}
```

#### 2. 音频播放Hook

```tsx
import { useAudioPlayer } from '@react-audio-studio/core';

function PlayerApp() {
  const player = useAudioPlayer({
    onError: (error) => console.error('播放错误:', error),
    onSuccess: (msg) => console.log('播放操作:', msg),
  });

  const handleFileLoad = (file: File) => {
    const url = URL.createObjectURL(file);
    player.loadAudio(url);
  };

  return (
    <div>
      <div>
        {player.formatTime(player.currentTime)} / {player.formatTime(player.duration)}
      </div>
      
      <input
        type="range"
        min={0}
        max={player.duration || 1}
        value={player.currentTime}
        onChange={(e) => player.setCurrentTime(Number(e.target.value))}
      />
      
      <button onClick={player.togglePlay} disabled={player.isLoading}>
        {player.isPlaying ? '暂停' : '播放'}
      </button>
      
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={player.volume}
        onChange={(e) => player.setVolume(Number(e.target.value))}
      />
    </div>
  );
}
```

#### 3. 音频处理Hook

```tsx
import { useAudioProcessing, type AudioProcessingParams } from '@react-audio-studio/core';

function ProcessingApp() {
  const processor = useAudioProcessing({
    onError: (error) => console.error('处理错误:', error),
    onSuccess: (msg) => console.log('处理成功:', msg),
  });

  const handleProcess = async (audioUrl: string) => {
    try {
      const processedBlob = await processor.processAudio(audioUrl);
      const processedUrl = URL.createObjectURL(processedBlob);
      console.log('处理后的音频:', processedUrl);
    } catch (error) {
      console.error('处理失败:', error);
    }
  };

  return (
    <div>
      {/* 清晰度调节 */}
      <label>清晰度: {processor.params.clarity}</label>
      <input
        type="range"
        min={0}
        max={100}
        value={processor.params.clarity}
        onChange={(e) => processor.setParams({ clarity: Number(e.target.value) })}
      />
      
      {/* 音量增益 */}
      <label>音量增益: {processor.params.volumeGain}</label>
      <input
        type="range"
        min={0}
        max={100}
        value={processor.params.volumeGain}
        onChange={(e) => processor.setParams({ volumeGain: Number(e.target.value) })}
      />
      
      {/* 预设应用 */}
      <button onClick={() => processor.applyPreset('standard')}>标准预设</button>
      <button onClick={() => processor.applyPreset('recommended')}>推荐预设</button>
      <button onClick={() => processor.applyPreset('highest')}>最高质量</button>
      
      <button onClick={() => processor.resetParams()}>重置参数</button>
    </div>
  );
}
```

#### 4. 实时调音Hook（核心功能）

```tsx
import { useToneTuning } from '@react-audio-studio/core';

function TuningApp() {
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const { audio, isProcessing, updateParams, resetParams, exportAudio } = useToneTuning(
    audioUrl,
    {
      clarity: 85,
      volumeGain: 95,
      reverb: 0,
      noiseReduction: 20
    }
  );

  // 实时调整参数 - 音频会自动更新
  const handleClarityChange = (value: number) => {
    updateParams({ clarity: value });
  };

  const handleExport = async () => {
    const blob = await exportAudio('WAV');
    if (blob) {
      const url = URL.createObjectURL(blob);
      // 触发下载
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processed_audio.wav';
      a.click();
    }
  };

  return (
    <div>
      {/* 调音后的音频自动更新 */}
      {audio && <audio controls src={audio} />}
      {isProcessing && <div>正在处理音频...</div>}
      
      <label>清晰度: </label>
      <input
        type="range"
        min={0}
        max={100}
        onChange={(e) => handleClarityChange(Number(e.target.value))}
      />
      
      <button onClick={resetParams}>重置参数</button>
      <button onClick={handleExport}>导出音频</button>
    </div>
  );
}
```

#### 5. React组件

```tsx
import { AudioRecorder, AudioWaveform, AudioTuner } from '@react-audio-studio/core';

function ComponentApp() {
  const [audioUrl, setAudioUrl] = useState<string>('');

  return (
    <div>
      {/* 录音组件 */}
      <AudioRecorder
        onRecordingComplete={(url, blob) => {
          setAudioUrl(url);
          console.log('录音完成:', url, blob);
        }}
        onRecordingStateChange={(state) => {
          console.log('录音状态:', state);
        }}
      />

      {/* 波形显示组件 */}
      {audioUrl && (
        <AudioWaveform
          audioUrl={audioUrl}
          height={120}
          onSegmentSelect={(segment) => {
            console.log('选中片段:', segment);
          }}
          onTimeUpdate={(time) => {
            console.log('播放时间:', time);
          }}
        />
      )}

      {/* 调音组件 */}
      {audioUrl && (
        <AudioTuner
          audioUrl={audioUrl}
          onAudioChange={(processedUrl) => {
            console.log('调音后音频:', processedUrl);
          }}
          onParamsChange={(params) => {
            console.log('参数变化:', params);
          }}
        />
      )}
    </div>
  );
}
```

#### 6. 设备能力检测

```tsx
import { useDeviceAudioCapabilities } from '@react-audio-studio/core';

function DeviceInfoApp() {
  const capabilities = useDeviceAudioCapabilities();

  return (
    <div>
      <h3>设备音频能力</h3>
      <div>最大采样率: {capabilities.formatSampleRate(capabilities.maxSampleRate)}</div>
      <div>支持格式: {capabilities.supportedFormats.join(', ')}</div>
      <div>音频上下文: {capabilities.deviceInfo.audioContext ? '✅' : '❌'}</div>
      <div>录音器: {capabilities.deviceInfo.mediaRecorder ? '✅' : '❌'}</div>
      <div>Web Audio: {capabilities.deviceInfo.webAudio ? '✅' : '❌'}</div>
    </div>
  );
}
```

## 🎯 核心 API

### Hooks

#### useToneTuning - 实时调音核心Hook
```tsx
const {
  audio,           // 处理后的音频URL，实时更新
  isProcessing,    // 是否正在处理
  updateParams,    // 更新参数函数
  resetParams,     // 重置参数
  exportAudio      // 导出音频Blob
} = useToneTuning(audioSource, initialParams);
```

#### useAudioRecording - 录音Hook
```tsx
const {
  isRecording,            // 是否正在录音
  recordingDuration,      // 录音时长
  recordingWaveRef,       // 波形显示容器引用
  isGettingPermission,    // 是否正在获取权限
  startRecording,         // 开始录音
  stopRecording,          // 停止录音
  formatRecordingTime     // 格式化录音时间
} = useAudioRecording(options);
```

#### useAudioPlayer - 播放Hook
```tsx
const {
  isPlaying,        // 是否正在播放
  currentTime,      // 当前播放时间
  duration,         // 音频总时长
  volume,           // 音量
  playbackRate,     // 播放速度
  isLoading,        // 是否加载中
  loadAudio,        // 加载音频
  togglePlay,       // 切换播放/暂停
  setCurrentTime,   // 设置播放位置
  setVolume,        // 设置音量
  setPlaybackRate,  // 设置播放速度
  formatTime        // 格式化时间
} = useAudioPlayer(options);
```

#### useAudioProcessing - 音频处理Hook
```tsx
const {
  params,          // 当前处理参数
  setParams,       // 设置参数
  resetParams,     // 重置参数
  applyPreset,     // 应用预设
  processAudio     // 处理音频
} = useAudioProcessing(options);
```

#### useDeviceAudioCapabilities - 设备能力检测
```tsx
const {
  maxSampleRate,        // 最大采样率
  supportedFormats,     // 支持的格式
  deviceInfo,           // 设备信息
  formatSampleRate      // 格式化采样率显示
} = useDeviceAudioCapabilities();
```

### 组件

#### AudioRecorder - 录音组件
```tsx
<AudioRecorder
  onRecordingComplete={(audioUrl, audioBlob) => {}}
  onRecordingStateChange={(state) => {}}
  className="custom-recorder"
  style={{ width: '100%' }}
/>
```

#### AudioWaveform - 波形显示组件
```tsx
<AudioWaveform
  audioUrl="path/to/audio.wav"
  height={120}
  onSegmentSelect={(segment) => {}}
  onTimeUpdate={(time) => {}}
  className="custom-waveform"
/>
```

#### AudioTuner - 调音组件
```tsx
<AudioTuner
  audioUrl="path/to/audio.wav"
  initialParams={{ clarity: 80, volumeGain: 90 }}
  onAudioChange={(processedUrl) => {}}
  onParamsChange={(params) => {}}
  className="custom-tuner"
/>
```

### 类型定义

#### AudioProcessingParams
```tsx
interface AudioProcessingParams {
  // 基础设置
  outputFormat: 'WAV' | 'OPUS' | 'MP3';
  sampleRate: '22.05kHz' | '44.1kHz' | '48kHz' | '96kHz';
  bitRate: '32' | '64' | '128' | '160' | '192' | '256' | '320';
  
  // 音质增强
  clarity: number;         // 清晰度 0-100
  volumeGain: number;      // 音量增益 0-100
  noiseReduction: number;  // 降噪 0-100
  bassBoost: number;       // 低音增强 0-100
  
  // 均衡器
  lowFreq: number;         // 低频 -20到+20dB
  midFreq: number;         // 中频 -20到+20dB
  highFreq: number;        // 高频 -20到+20dB
  
  // 专业调音
  voiceMidFreq: number;    // 人声清晰度 0-100
  highFreqSmooth: number;  // 高频舒适度 0-100
  lowFreqClear: number;    // 低频通透感 0-100
  
  // 空间效果
  reverb: number;          // 混响 0-100
  decayTime: number;       // 衰减时间 0-100
  stereoWidth: number;     // 立体声宽度 0-100
}
```

#### AudioSegment
```tsx
interface AudioSegment {
  startTime: number;
  endTime: number;
  editable?: boolean;
  color?: string;
  labelText?: string;
  id?: string;
}
```

#### RecordingState
```tsx
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl?: string;
  audioBlob?: Blob;
}
```

## 📱 开发和示例

### 启动开发环境

```bash
# 克隆项目
git clone https://github.com/your-username/react-audio-studio.git
cd react-audio-studio

# 安装依赖
yarn install

# 启动开发环境（会提供选择菜单）
yarn dev
```

开发脚本提供三个选项：
1. **Antd 示例** - 完整功能演示（使用Ant Design UI）
2. **Basic 示例** - 原生HTML/CSS基础用法示例  
3. **组件库开发模式** - 用于开发组件库本身

### 示例应用

#### Basic 示例（推荐学习）
原生实现，不依赖任何UI库：
- 录音功能演示
- 音频播放控制
- 音频处理参数调节
- 设备能力检测
- 完整的Hook使用示例

#### Antd 示例
完整的音频工作台，包含：
- 美观的录音器界面
- 实时调音面板
- 波形显示和片段选择
- 音频对比播放
- 参数预设和导出功能

## 🔧 技术栈

- **React 18+** - 现代React特性
- **TypeScript** - 类型安全
- **Web Audio API** - 音频处理
- **MediaRecorder API** - 音频录制
- **Peaks.js** - 专业波形显示
- **recorder-core** - 录音核心库
- **Konva** - 2D Canvas库
- **Waveform-data** - 波形数据处理

## 📦 核心特色

### 🚀 实时性优先
- 参数调整时音频立即更新，无需点击"应用"按钮
- 300ms防抖优化，避免频繁处理
- 流畅的用户体验

### 🎯 专业级功能
- 基于Web Audio API的专业音频处理
- 支持多种音频格式和采样率
- 完整的均衡器和音效处理

### 💡 易用性设计
- 直观的Hook API设计
- 完整的TypeScript类型支持
- 丰富的预设配置
- 无UI库依赖，可配合任意UI框架

### 🔌 灵活集成
- 纯React组件，无外部UI依赖
- 支持自定义样式和主题
- 可单独使用各个Hook
- 支持现代打包工具

## 🔮 Roadmap

- [ ] 支持更多音频格式（FLAC、AAC等）
- [ ] 添加音频可视化效果
- [ ] 实时音频流处理
- [ ] 音频文件批量处理
- [ ] VST插件支持
- [ ] 移动端优化
- [ ] 音频分析和频谱显示

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**专业提示**: 使用 `useToneTuning` Hook 时，`audio` 属性会在参数变化时实时更新，可以直接用于 `<audio>` 标签或其他播放器组件。组件库不依赖任何UI框架，可以与React生态系统中的任意UI库配合使用。 