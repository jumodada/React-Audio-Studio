import { useMemo } from 'react';

export const useAudioOptions = () => {
  // 音频格式选项
  const formatOptions = useMemo(() => [
    { value: 'MP3', label: 'MP3 (兼容性最佳)' },
    { value: 'WAV', label: 'WAV (无损质量)' },
    { value: 'OPUS', label: 'OPUS (高效压缩)' },
  ], []);

  // 采样率选项
  const sampleRateOptions = useMemo(() => [
    { value: '44.1kHz', label: '44.1 kHz (CD质量)' },
    { value: '48kHz', label: '48 kHz (专业音频)' },
    { value: '96kHz', label: '96 kHz (高清音频)' },
  ], []);

  // 比特率/位深度选项配置
  const bitRateOptionsMap = useMemo(() => ({
    MP3: [
      { value: '128', label: '128 kbps (标准质量)' },
      { value: '192', label: '192 kbps (高质量)' },
      { value: '320', label: '320 kbps (极高质量)' },
    ],
    WAV: [
      { value: '16', label: '16 bit (标准质量)' },
      { value: '24', label: '24 bit (专业质量)' },
      { value: '32', label: '32 bit (浮点, 最高质量)' },
    ],
    OPUS: [
      { value: '96', label: '96 kbps (标准质量)' },
      { value: '128', label: '128 kbps (高质量)' },
      { value: '160', label: '160 kbps (极高质量)' },
    ],
  }), []);

  // 根据格式获取比特率/位深度选项
  const getBitRateOptions = (format: string) => {
    return bitRateOptionsMap[format as keyof typeof bitRateOptionsMap] || bitRateOptionsMap.MP3;
  };

  // 滑动条标记
  const sliderMarks = useMemo(() => ({
    reverb: {
      0: '无',
      50: '中',
      100: '大',
    },
    decayTime: {
      0: '短',
      50: '中',
      100: '长',
    },
    stereoWidth: {
      0: '窄',
      50: '正常',
      100: '宽',
    },
    noiseReduction: {
      0: '关闭',
      50: '中等',
      100: '最大',
    },
    volumeGain: {
      0: '静音',
      50: '原音量',
      100: '增强',
    },
    clarity: {
      0: '自然',
      50: '清晰',
      100: '超清晰',
    },
    equalizer: {
      '-12': '-12dB',
      0: '0dB',
      12: '+12dB',
    },
    bassBoost: {
      0: '无压缩',
      50: '中等',
      100: '最大',
    },
    voiceClarity: {
      0: '朦胧',
      50: '自然',
      100: '锐利',
    },
    highFreqSmooth: {
      0: '尖锐',
      50: '平衡',
      100: '柔和',
    },
    lowFreqClear: {
      0: '闷塞',
      50: '平衡',
      100: '通透',
    },
  }), []);

  // 预设配置说明
  const presetConfigs = useMemo(() => [
    {
      key: 'standard',
      title: '标准音质',
      description: ['基础降噪', '音质增强', '平衡处理'],
      icon: 'SoundOutlined',
      hasTooltip: true,
      isRecommended: false,
    },
    {
      key: 'recommended',
      title: '推荐音质',
      description: ['智能去噪', '清晰增强', '优化输出'],
      icon: 'ThunderboltOutlined',
      hasTooltip: true,
      isRecommended: true,
    },
    {
      key: 'highest',
      title: '专业音质',
      description: ['深度处理', '音质增强', 'WAV无损'],
      icon: 'CrownOutlined',
      hasTooltip: true,
      isRecommended: false,
    },
  ], []);

  return {
    formatOptions,
    sampleRateOptions,
    getBitRateOptions,
    sliderMarks,
    presetConfigs,
  };
}; 