# React Audio Studio

🎵 一个现代化的React音频录制和处理工作台组件库

[![npm version](https://badge.fury.io/js/@react-audio-studio/core.svg)](https://badge.fury.io/js/@react-audio-studio/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ 特性

- 🎤 **音频录制** - 支持高质量音频录制，实时波形显示
- 🔊 **音频播放** - 功能完整的音频播放器，支持播放控制
- ⚡ **音频处理** - 内置音频处理算法，支持降噪、均衡器等
- 📱 **设备检测** - 自动检测设备音频能力和兼容性
- 🎨 **UI 友好** - 与 Ant Design 完美集成
- 🔧 **Hook 架构** - 基于 React Hooks 的现代化API设计
- 📦 **TypeScript** - 完整的类型定义支持
- 🚀 **现代构建** - 使用 Vite 构建，支持 ESM 和 UMD

## 📦 安装

```bash
npm install @react-audio-studio/core
# 或
yarn add @react-audio-studio/core
# 或
pnpm add @react-audio-studio/core
```

## 🚀 快速开始

### 基础录音功能

```tsx
import React from 'react';
import { useAudioRecording } from '@react-audio-studio/core';

function AudioRecorder() {
  const recording = useAudioRecording({
    onError: (error) => console.error('录音错误:', error),
    onSuccess: (message) => console.log('录音成功:', message),
  });

  const handleStartRecording = () => {
    recording.startRecording(() => {
      console.log('开始录音');
    });
  };

  const handleStopRecording = () => {
    recording.stopRecording((audioUrl) => {
      console.log('录音完成，音频URL:', audioUrl);
    });
  };

  return (
    <div>
      <div ref={recording.recordingWaveRef} style={{ height: '60px' }} />
      <p>录音时长: {recording.formatRecordingTime(recording.recordingDuration)}</p>
      <button 
        onClick={handleStartRecording} 
        disabled={recording.isRecording}
      >
        {recording.isGettingPermission ? '获取权限中...' : '开始录音'}
      </button>
      <button 
        onClick={handleStopRecording} 
        disabled={!recording.isRecording}
      >
        停止录音
      </button>
    </div>
  );
}
```

### 音频播放器

```tsx
import React, { useState } from 'react';
import { useAudioPlayer } from '@react-audio-studio/core';

function AudioPlayer() {
  const [audioUrl, setAudioUrl] = useState('');
  const player = useAudioPlayer({
    onError: (error) => console.error('播放错误:', error),
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      player.loadAudio(url);
    }
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      
      <div>
        <span>{player.formatTime(player.currentTime)}</span>
        <input
          type="range"
          min={0}
          max={player.duration || 1}
          step={0.1}
          value={player.currentTime}
          onChange={(e) => player.setCurrentTime(Number(e.target.value))}
        />
        <span>{player.formatTime(player.duration)}</span>
      </div>
      
      <button onClick={player.togglePlay} disabled={!audioUrl}>
        {player.isPlaying ? '暂停' : '播放'}
      </button>
      
      <div>
        <label>音量: </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={player.volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
```

### 音频处理

```tsx
import React from 'react';
import { useAudioProcessing } from '@react-audio-studio/core';

function AudioProcessor() {
  const processor = useAudioProcessing({
    onError: (error) => console.error('处理错误:', error),
    onSuccess: (message) => console.log('处理成功:', message),
  });

  const handleProcessAudio = async (audioUrl: string) => {
    try {
      const processedBlob = await processor.processAudio(audioUrl);
      const processedUrl = URL.createObjectURL(processedBlob);
      console.log('处理完成:', processedUrl);
    } catch (error) {
      console.error('处理失败:', error);
    }
  };

  return (
    <div>
      <div>
        <label>输出格式: </label>
        <select 
          value={processor.params.outputFormat}
          onChange={(e) => processor.updateParams({ 
            outputFormat: e.target.value as any 
          })}
        >
          <option value="wav">WAV</option>
          <option value="mp3">MP3</option>
          <option value="opus">OPUS</option>
        </select>
      </div>
      
      <div>
        <label>降噪: </label>
        <input
          type="range"
          min={0}
          max={100}
          value={processor.params.noiseReduction}
          onChange={(e) => processor.updateParams({ 
            noiseReduction: Number(e.target.value) 
          })}
        />
      </div>
      
      <button onClick={() => processor.applyPreset('recommended')}>
        应用推荐预设
      </button>
      
      <button onClick={() => processor.resetParams()}>
        重置参数
      </button>
    </div>
  );
}
```

## 🎯 核心 Hooks

### useAudioRecording

音频录制功能Hook

**参数:**
- `onError?: (error: string) => void` - 错误回调
- `onSuccess?: (message: string) => void` - 成功回调
- `enableWaveform?: boolean` - 是否启用波形显示

**返回值:**
- `isRecording: boolean` - 是否正在录音
- `recordingDuration: number` - 录音时长（秒）
- `startRecording: (onClear: () => void) => void` - 开始录音
- `stopRecording: (onGenerated: (url: string) => void) => void` - 停止录音
- `recordingWaveRef: RefObject<HTMLDivElement>` - 波形显示容器引用

### useAudioPlayer

音频播放功能Hook

**参数:**
- `onError?: (error: string) => void` - 错误回调
- `onSuccess?: (message: string) => void` - 成功回调

**返回值:**
- `isPlaying: boolean` - 是否正在播放
- `currentTime: number` - 当前播放时间
- `duration: number` - 音频总时长
- `volume: number` - 音量（0-1）
- `loadAudio: (url: string) => void` - 加载音频
- `togglePlay: () => void` - 播放/暂停切换

### useAudioProcessing

音频处理功能Hook

**参数:**
- `onError?: (error: string) => void` - 错误回调
- `onSuccess?: (message: string) => void` - 成功回调

**返回值:**
- `params: AudioProcessingParams` - 当前处理参数
- `updateParams: (updates: Partial<AudioProcessingParams>) => void` - 更新参数
- `processAudio: (url: string) => Promise<Blob>` - 处理音频
- `applyPreset: (name: string) => void` - 应用预设

### useDeviceAudioCapabilities

设备音频能力检测Hook

**返回值:**
- `maxSampleRate: number` - 最大支持采样率
- `supportedFormats: AudioFormat[]` - 支持的音频格式
- `deviceInfo: DeviceInfo` - 设备信息

## 🏗️ 开发

### 克隆项目

```bash
git clone https://github.com/your-username/react-audio-studio.git
cd react-audio-studio
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 运行示例

```bash
npm run dev:example
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
npm run lint:fix
```

## 📁 项目结构

```
react-audio-studio/
├── src/                    # 源代码
│   ├── hooks/             # React Hooks
│   ├── types/             # TypeScript 类型定义
│   └── index.ts           # 入口文件
├── examples/              # 示例项目
│   ├── basic-example/     # 基础示例
│   └── antd-example/      # Ant Design 集成示例
├── dist/                  # 构建输出
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🌟 示例项目

### Ant Design 集成示例

本项目提供了一个完整的 Ant Design 集成示例，展示了如何在实际项目中使用所有功能。

```bash
cd examples/antd-example
npm install
npm run dev
```

示例包含：
- 完整的录音工作台
- 音频播放控制面板
- 音频处理参数调节
- 设备兼容性检测
- 现代化的UI界面

## 🤝 贡献

欢迎提交 issue 和 pull request！

### 开发指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Recorder Core](https://github.com/xiangyuecn/Recorder) - 音频录制核心库
- [Ant Design](https://ant.design/) - UI 组件库
- [Vite](https://vitejs.dev/) - 构建工具

## 📞 支持

如果你有任何问题或建议，请：

- 提交 [Issue](https://github.com/your-username/react-audio-studio/issues)
- 发送邮件到 your-email@example.com
- 加入我们的讨论群

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！ 