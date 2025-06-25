# 🎵 React Audio Studio

一个现代化的React音频录制和处理工作台组件库，基于peaks.js构建，提供专业级的音频录制、实时调音和波形显示功能。

[![npm version](https://badge.fury.io/js/@react-audio-studio/core.svg)](https://badge.fury.io/js/@react-audio-studio/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ 特性

### 🎤 核心功能
- **在线录音器** - 支持暂停/继续，实时音量显示
- **实时调音** - 参数调整时音频实时更新，无需等待
- **波形显示** - 基于peaks.js的专业波形可视化
- **音频片段选择** - 可视化选择和播放音频片段
- **多格式支持** - WAV、OPUS、MP3格式输出

### 🔧 专业调音功能
- **智能预设** - 标准、推荐、最高质量三种预设模式
- **专业均衡器** - 低频/中频/高频独立调节
- **人声优化** - 人声清晰度、高频舒适度、低频通透感
- **音质增强** - 清晰度、音量增益、降噪、低音增强
- **空间效果** - 混响、立体声宽度调节

## 🚀 快速开始

### 安装

```bash
npm install @react-audio-studio/core
# 或
yarn add @react-audio-studio/core
```

### 基础用法

#### 1. 在线录音器

```tsx
import { AudioRecorder } from '@react-audio-studio/core';

function App() {
  const handleRecordingComplete = (audioUrl: string, audioBlob: Blob) => {
    console.log('录音完成:', audioUrl);
  };

  return (
    <AudioRecorder
      onRecordingComplete={handleRecordingComplete}
      onRecordingStateChange={(state) => console.log('录音状态:', state)}
    />
  );
}
```

#### 2. 实时调音 Hook（核心功能）

```tsx
import { useToneTuning } from '@react-audio-studio/core';

function AudioTuningApp() {
  const { audio, isProcessing, updateParams, resetParams, exportAudio } = useToneTuning(
    audioUrl, // 音频源文件URL
    {
      clarity: 85,
      volumeGain: 95,
      reverb: 0,
      noiseReduction: 20
    }
  );

  // 实时调整参数
  const handleClarityChange = (value: number) => {
    updateParams({ clarity: value }); // 参数变化时音频实时更新
  };

  return (
    <div>
      {/* 调音后的音频会实时更新 */}
      {audio && <audio controls src={audio} />}
      
      <input
        type="range"
        min={0}
        max={100}
        value={85}
        onChange={(e) => handleClarityChange(Number(e.target.value))}
      />
      
      <button onClick={resetParams}>重置参数</button>
      <button onClick={() => exportAudio()}>导出音频</button>
    </div>
  );
}
```

#### 3. 波形显示组件

```tsx
import { AudioWaveform } from '@react-audio-studio/core';

function WaveformApp() {
  const handleSegmentSelect = (segment) => {
    console.log('选中片段:', segment);
  };

  return (
    <AudioWaveform
      audioUrl="path/to/audio.wav"
      height={120}
      onSegmentSelect={handleSegmentSelect}
      onTimeUpdate={(time) => console.log('播放时间:', time)}
    />
  );
}
```

#### 4. 完整的音频调音器

```tsx
import { AudioTuner } from '@react-audio-studio/core';

function FullTunerApp() {
  const handleAudioChange = (processedAudioUrl: string) => {
    console.log('调音后音频:', processedAudioUrl);
  };

  return (
    <AudioTuner
      audioUrl="path/to/audio.wav"
      onAudioChange={handleAudioChange}
      onParamsChange={(params) => console.log('参数变化:', params)}
    />
  );
}
```

## 🎯 核心 API

### useToneTuning Hook

实时音频调音的核心Hook，参数变化时音频立即更新。

```tsx
const {
  audio,           // 处理后的音频URL，实时更新
  isProcessing,    // 是否正在处理
  updateParams,    // 更新参数函数
  resetParams,     // 重置参数
  exportAudio      // 导出音频Blob
} = useToneTuning(audioSource, initialParams);
```

### AudioProcessingParams

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
1. **Antd 示例** (推荐) - 完整功能演示
2. **Basic 示例** - 基础用法示例  
3. **组件库开发模式** - 用于开发组件库本身

### 示例应用

#### Antd 示例
完整的音频工作台，包含：
- 录音器界面
- 实时调音面板
- 波形显示和片段选择
- 音频对比播放
- 参数预设和导出功能

#### Basic 示例
简单的使用示例，展示各个组件的基本用法。

## 🔧 技术栈

- **React 18+** - 现代React特性
- **TypeScript** - 类型安全
- **Peaks.js** - 专业波形显示
- **Web Audio API** - 音频处理
- **MediaRecorder API** - 音频录制
- **recorder-core** - 录音核心库

## 📦 组件列表

### 核心组件
- `AudioRecorder` - 录音组件
- `AudioWaveform` - 波形显示组件  
- `AudioTuner` - 音频调音组件

### 核心 Hooks
- `useToneTuning` - 实时调音Hook ⭐
- `useAudioRecorder` - 录音Hook
- `useAudioPlayer` - 音频播放Hook
- `useAudioProcessing` - 音频处理Hook
- `useDeviceAudioCapabilities` - 设备能力检测

## 🎨 设计理念

### 实时性优先
- 参数调整时音频立即更新，无需点击"应用"按钮
- 300ms防抖优化，避免频繁处理
- 流畅的用户体验

### 专业级功能
- 基于Web Audio API的专业音频处理
- 支持多种音频格式和采样率
- 完整的均衡器和音效处理

### 易用性设计
- 直观的组件API设计
- 完整的TypeScript类型支持
- 丰富的预设配置

## 🔮 roadmap

- [ ] 支持更多音频格式（FLAC、AAC等）
- [ ] 添加音频可视化效果
- [ ] 实时音频流处理
- [ ] 音频文件批量处理
- [ ] VST插件支持
- [ ] 移动端优化

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**专业提示**: 使用 `useToneTuning` Hook 时，`const {audio} = useToneTuning(audioSource, params)` 中的 `audio` 会在参数变化时实时更新，可以直接用于 `<audio>` 标签或其他播放器组件。 