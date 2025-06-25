import { useRef, useCallback, useEffect } from 'react';
import { Form } from 'antd';

// 添加预设配置类型
type PresetConfig = {
  outputFormat: string;
  sampleRate: string;
  bitRate: string;
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
};

type PresetConfigs = {
  [key: string]: PresetConfig;
};

// 预设配置对象 - 优化的音频处理配置
const presetConfigs: PresetConfigs = {
  standard: {
    outputFormat: 'OPUS',
    sampleRate: '44.1kHz',
    bitRate: '128',
    clarity: 60,                // 提高清晰度
    volumeGain: 55,            // 轻微增强音量
    reverb: 0,                 // 无混响，保持清晰
    decayTime: 20,            // 短衰减时间，减少环境影响
    stereoWidth: 30,          // 窄立体声
    noiseReduction: 40,       // 适度降噪
    lowFreq: -8,              // 减少低频，降低环境噪音
    midFreq: 2,               // 轻微提升中频
    highFreq: 4,              // 提升高频，增加清晰度
    bassBoost: 15,            // 轻微压缩，稳定音量
    voiceMidFreq: 50,         // 标准人声清晰度
    highFreqSmooth: 50,       // 标准高频舒适度
    lowFreqClear: 50,         // 标准低频通透感
  },
  recommended: {
    outputFormat: 'OPUS',
    sampleRate: '96kHz',
    bitRate: '160',
    clarity: 85,               // 高清晰度
    volumeGain: 95,           // 接近最大增益
    reverb: 0,                // 无混响，保持纯净
    decayTime: 15,           // 很短的衰减时间
    stereoWidth: 25,         // 更窄的立体声
    noiseReduction: 20,      // 强降噪
    lowFreq: -10,            // 显著减少低频噪音
    midFreq: 0,              // 保持中频自然
    highFreq: 6,             // 较强的高频增强
    bassBoost: 25,           // 适中的压缩比
    voiceMidFreq: 60,        // 略高的人声清晰度
    highFreqSmooth: 45,      // 略低的高频舒适度（更加锐利）
    lowFreqClear: 55,        // 略高的低频通透感
  },
  highest: {
    outputFormat: 'WAV',
    sampleRate: '96kHz',
    bitRate: '32',
    clarity: 75,              // 适中清晰度，避免刺耳感
    volumeGain: 85,          // 适当增益，避免失真
    reverb: 0,               
    decayTime: 15,          // 短衰减时间
    stereoWidth: 45,        // 接近自然的立体声宽度
    noiseReduction: 40,     // 强力降噪但保留声音细节
    lowFreq: -5,            // 轻微减弱低频，避免闷塞感
    midFreq: 4,             // 明显提升中频，增强咬字清晰度
    highFreq: 2,            // 轻微提升高频，避免刺耳感
    bassBoost: 30,          // 适中压缩，确保清晰度
    voiceMidFreq: 75,       // 增强人声清晰度
    highFreqSmooth: 70,     // 较高的高频舒适度
    lowFreqClear: 65,       // 增强低频通透感
  }
};

// 确保音频参数值是有效的数字
const ensureSafeAudioParam = (value: any, defaultValue: number = 0): number => {
  const numValue = Number(value);
  return isFinite(numValue) ? numValue : defaultValue;
};

// 添加音频缓冲区转WAV函数
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer2 = new ArrayBuffer(44 + length);
  const view = new DataView(buffer2);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // 写入 WAV 文件头
  setUint32(0x46464952);                         // "RIFF"
  setUint32(36 + length);                        // 文件长度
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // 长度 = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit
  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length);                             // chunk length

  // 写入音频数据
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

export const useAudioProcessing = (messageApi?: any) => {
  // 使用Form替代state，添加初始值
  const [form] = Form.useForm();

  // 设置表单的初始默认值
  const defaultFormValues = {
    outputFormat: 'WAV',
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
    // 新增专业调音参数
    voiceMidFreq: 50,
    highFreqSmooth: 50,
    lowFreqClear: 50,
  };

  // 初始化表单默认值
  useEffect(() => {
    form.setFieldsValue(defaultFormValues);
  }, [form]);

  // 音频处理节点引用
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);

  // 均衡器节点
  const lowFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);
  const clarityFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const stereoEnhancerRef = useRef<{
    left: GainNode;
    right: GainNode;
    splitter: ChannelSplitterNode;
    merger: ChannelMergerNode
  } | null>(null);

  // 创建混响脉冲响应
  const createReverbImpulse = useCallback((audioContext: AudioContext | OfflineAudioContext, reverbAmount: number, decay: number) => {
    // 确保参数是安全的
    reverbAmount = ensureSafeAudioParam(reverbAmount, 0);
    decay = ensureSafeAudioParam(decay, 50);

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
  }, []);

  // 获取当前表单值
  const formValues = Form.useWatch(null, form);

  // 更新音频处理链
  const updateAudioChain = useCallback(() => {
    if (!sourceRef.current || !gainNodeRef.current || !filterNodeRef.current || !audioContextRef.current) {
      return;
    }

    // 获取当前表单的所有值
    const values = form.getFieldsValue();
    const {
      volumeGain = 50,
      noiseReduction = 0,
      reverb = 0,
      lowFreq = 0,
      midFreq = 0,
      highFreq = 0,
      clarity = 0,
      bassBoost = 0,
      stereoWidth = 50,
      // 新增参数
      voiceMidFreq = 50,
      highFreqSmooth = 50,
      lowFreqClear = 50
    } = values;

    try {
      // 断开所有连接
      const disconnectNodes = [
        sourceRef.current,
        gainNodeRef.current,
        filterNodeRef.current,
        convolverRef.current,
        lowFilterRef.current,
        midFilterRef.current,
        highFilterRef.current,
        clarityFilterRef.current,
        compressorRef.current,
      ];

      disconnectNodes.forEach(node => {
        if (node) {
          node.disconnect();
        }
      });

      // 断开复合节点
      if (stereoEnhancerRef.current) {
        const stereoNodes = [
          stereoEnhancerRef.current.left,
          stereoEnhancerRef.current.right,
          stereoEnhancerRef.current.splitter,
          stereoEnhancerRef.current.merger
        ];
        stereoNodes.forEach(node => node.disconnect());
      }

      // 更新参数，确保值是有效数字
      gainNodeRef.current.gain.value = ensureSafeAudioParam(volumeGain / 50, 1);
      filterNodeRef.current.frequency.value = ensureSafeAudioParam(
          Math.max(1000, 8000 - (noiseReduction * 70)),
          4000
      );

      // 更新均衡器参数
      const filterUpdates = [
        // 基本均衡器
        { ref: lowFilterRef, value: ensureSafeAudioParam(lowFreq, 0) },
        { ref: midFilterRef, value: ensureSafeAudioParam(midFreq, 0) },
        { ref: highFilterRef, value: ensureSafeAudioParam(highFreq, 0) },
        { ref: clarityFilterRef, value: ensureSafeAudioParam(clarity * 0.2, 0) },
        
        // 专业调音均衡器
        // 低频通透感处理 - 从滑块值(0-100)映射到-6到+6增益，中点50无增益
        { ref: lowFilterRef, type: 'frequency', value: ensureSafeAudioParam(150 + (lowFreqClear - 50) * 3, 150) },
        { ref: lowFilterRef, type: 'Q', value: ensureSafeAudioParam(1 + (lowFreqClear - 50) * 0.02, 1) },
        
        // 人声清晰度处理 - 3kHz是人声最清晰的频段
        { ref: midFilterRef, type: 'frequency', value: ensureSafeAudioParam(3000 + (voiceMidFreq - 50) * 20, 3000) },
        { ref: midFilterRef, type: 'gain', value: ensureSafeAudioParam((voiceMidFreq - 50) * 0.12, 0) },
        { ref: midFilterRef, type: 'Q', value: ensureSafeAudioParam(1.5 + (voiceMidFreq - 50) * 0.01, 1.5) },
        
        // 高频舒适度处理 - 消除刺耳感
        { ref: highFilterRef, type: 'frequency', value: ensureSafeAudioParam(10000 + (100 - highFreqSmooth) * 40, 10000) },
        { ref: highFilterRef, type: 'gain', value: ensureSafeAudioParam((50 - highFreqSmooth) * 0.1, 0) },
      ];

      filterUpdates.forEach(({ ref, type, value }) => {
        if (ref.current) {
          if (type === 'frequency') {
            ref.current.frequency.value = value;
          } else if (type === 'Q' && ref.current.Q) {
            ref.current.Q.value = value;
          } else if (type === 'gain') {
            ref.current.gain.value = value;
          } else if (!type) {
            ref.current.gain.value = value;
          }
        }
      });
      if (compressorRef.current) {
        compressorRef.current.ratio.value = ensureSafeAudioParam(1 + (bassBoost / 100) * 12, 1);
      }

      if (stereoEnhancerRef.current) {
        const widthFactor = ensureSafeAudioParam(stereoWidth / 50, 1);
        stereoEnhancerRef.current.left.gain.value = widthFactor;
        stereoEnhancerRef.current.right.gain.value = widthFactor;
      }

      // 重新连接处理链
      let currentNode: AudioNode = sourceRef.current;

      // 定义音频处理链顺序
      const audioChain = [
        filterNodeRef.current,              // 基础降噪
        lowFilterRef.current,               // 低频均衡
        midFilterRef.current,               // 中频均衡  
        highFilterRef.current,              // 高频均衡
        clarityFilterRef.current,           // 清晰度增强
        compressorRef.current,              // 基础压缩
        gainNodeRef.current                 // 最终音量调整
      ];

      // 遍历连接音频处理链
      audioChain.forEach(node => {
        if (node) {
          currentNode.connect(node);
          currentNode = node;
        }
      });

      const safeValue = ensureSafeAudioParam(stereoWidth, 50);
      if (stereoEnhancerRef.current && safeValue !== 50) {
        const {left, right, splitter, merger} = stereoEnhancerRef.current;
        gainNodeRef.current.connect(splitter);
        splitter.connect(left, 0);
        splitter.connect(right, 1);
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        currentNode = merger;
      } else {
        currentNode = gainNodeRef.current;
      }

      const safeReverb = ensureSafeAudioParam(reverb, 0);
      if (safeReverb > 0 && convolverRef.current && convolverRef.current.buffer) {
        const dryGain = audioContextRef.current.createGain();
        const wetGain = audioContextRef.current.createGain();
        const merger = audioContextRef.current.createChannelMerger(2);

        dryGain.gain.value = 1 - (safeReverb / 100);
        wetGain.gain.value = safeReverb / 100;

        currentNode.connect(dryGain);
        dryGain.connect(merger, 0, 0);
        dryGain.connect(merger, 0, 1);

        currentNode.connect(convolverRef.current);
        convolverRef.current.connect(wetGain);
        wetGain.connect(merger, 0, 0);
        wetGain.connect(merger, 0, 1);

        merger.connect(audioContextRef.current.destination);
      } else {
        currentNode.connect(audioContextRef.current.destination);
      }
    } catch (error) {
      console.error('更新音频处理链失败:', error);
    }
  }, [form]);

  // 初始化音频处理链
  const initAudioProcessing = useCallback((audioElement: HTMLAudioElement, forceReinit: boolean = false) => {
    // 如果强制重新初始化或者尚未初始化，则继续
    if (!forceReinit && audioContextRef.current &&
        audioContextRef.current.state !== 'closed' &&
        sourceRef.current &&
        gainNodeRef.current) {
      return;
    }

    try {
      // 清理旧的音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          // 统一清理所有音频节点
          const audioNodes = [
            sourceRef,
            gainNodeRef,
            filterNodeRef,
            convolverRef,
            lowFilterRef,
            midFilterRef,
            highFilterRef,
            clarityFilterRef,
            compressorRef,
          ];

          audioNodes.forEach(nodeRef => {
            if (nodeRef.current) {
              nodeRef.current.disconnect();
              nodeRef.current = null;
            }
          });

          audioContextRef.current.close();
        } catch (error) {
          console.warn('清理旧音频上下文时出错:', error);
        }
      }

      // 获取当前表单的所有值
      const values = form.getFieldsValue();
      const {
        volumeGain = 50,
        noiseReduction = 0,
        lowFreq = 0,
        midFreq = 0,
        highFreq = 0,
        clarity = 0,
        bassBoost = 0,
        stereoWidth = 50,
        reverb = 0,
        decayTime = 50,
      } = values;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);

      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = ensureSafeAudioParam(volumeGain / 50, 1);

      filterNodeRef.current = audioContextRef.current.createBiquadFilter();
      filterNodeRef.current.type = 'lowpass';
      filterNodeRef.current.frequency.value = ensureSafeAudioParam(
          Math.max(1000, 8000 - (noiseReduction * 70)),
          4000
      );

      convolverRef.current = audioContextRef.current.createConvolver();

      // 创建均衡器节点 - 使用配置映射优化
      const filterConfigs = {
        lowFilter: {
          ref: lowFilterRef,
          type: 'peaking' as BiquadFilterType,
          frequency: 150,
          Q: 1,
          gain: ensureSafeAudioParam(lowFreq, 0)
        },
        midFilter: {
          ref: midFilterRef,
          type: 'peaking' as BiquadFilterType,
          frequency: 1000,
          Q: 1,
          gain: ensureSafeAudioParam(midFreq, 0)
        },
        highFilter: {
          ref: highFilterRef,
          type: 'peaking' as BiquadFilterType,
          frequency: 8000,
          Q: 1,
          gain: ensureSafeAudioParam(highFreq, 0)
        },
        clarityFilter: {
          ref: clarityFilterRef,
          type: 'highshelf' as BiquadFilterType,
          frequency: 6000,
          Q: undefined, // highshelf 类型不需要 Q 值
          gain: ensureSafeAudioParam(clarity * 0.2, 0)
        },
        // 增加额外的低频细节过滤器，处理闷塞感
        lowMidFilter: {
          ref: lowFilterRef, // 重用已有的过滤器
          type: 'peaking' as BiquadFilterType,
          frequency: 300, // 300Hz处理低频闷塞感
          Q: 1.2, // 更尖锐的Q值以处理特定频段
          gain: ensureSafeAudioParam(lowFreq * 0.7, 0) // 与低频相关但更柔和
        },
        // 增加中高频过渡带过滤器，优化人声清晰度
        midHighFilter: {
          ref: midFilterRef, // 重用已有的过滤器
          type: 'peaking' as BiquadFilterType,
          frequency: 3000, // 3kHz处理清晰咬字
          Q: 1.5,
          gain: ensureSafeAudioParam(midFreq * 1.2, 0) // 略微强化中频效果
        },
        // 高频抑制过滤器，减少刺耳感
        highDampFilter: {
          ref: highFilterRef, // 重用已有的过滤器
          type: 'highshelf' as BiquadFilterType,
          frequency: 12000, // 超高频段抑制
          Q: undefined,
          gain: ensureSafeAudioParam(highFreq * 0.5, 0) // 高频的一半，避免刺耳
        }
      };

      // 遍历创建均衡器节点
      Object.values(filterConfigs).forEach(config => {
        config.ref.current = audioContextRef.current!.createBiquadFilter();
        config.ref.current.type = config.type;
        config.ref.current.frequency.value = config.frequency;
        if (config.Q !== undefined) {
          config.ref.current.Q.value = config.Q;
        }
        if (config.gain !== undefined) {
          config.ref.current.gain.value = config.gain;
        }
      });

      // 创建压缩器
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();
      const compressorConfig = {
        threshold: -24,
        knee: 30,
        ratio: ensureSafeAudioParam(1 + (bassBoost / 100) * 12, 1),
        attack: 0.003,
        release: 0.25
      };

      Object.entries(compressorConfig).forEach(([key, value]) => {
        (compressorRef.current as any)[key].value = value;
      });

      // 立体声宽度增强器
      const splitter = audioContextRef.current.createChannelSplitter(2);
      const merger = audioContextRef.current.createChannelMerger(2);
      const leftGain = audioContextRef.current.createGain();
      const rightGain = audioContextRef.current.createGain();

      const widthFactor = ensureSafeAudioParam(stereoWidth / 50, 1);
      leftGain.gain.value = widthFactor;
      rightGain.gain.value = widthFactor;

      stereoEnhancerRef.current = {
        splitter,
        merger,
        left: leftGain,
        right: rightGain
      };

      // 初始化混响缓冲区
      const safeReverb = ensureSafeAudioParam(reverb, 0);
      if (safeReverb > 0) {
        const impulseBuffer = createReverbImpulse(
            audioContextRef.current,
            safeReverb,
            ensureSafeAudioParam(decayTime, 50)
        );
        convolverRef.current.buffer = impulseBuffer;
      }

      // 确保使用当前表单值更新音频链
      setTimeout(() => {
        updateAudioChain();
      }, 50);

    } catch (error) {
      console.error('初始化音频处理失败:', error);
      if (error instanceof DOMException && error.name === 'SecurityError') {
        messageApi?.error('音频初始化失败：可能是跨域问题，请确保音频文件支持跨域访问');
      } else if (error instanceof DOMException && error.name === 'InvalidStateError') {
        messageApi?.error('音频初始化失败：音频元素状态异常，请重新加载音频');
      } else {
        messageApi?.error('音频初始化失败，请检查音频文件格式是否支持');
      }
    }
  }, [form, createReverbImpulse, updateAudioChain, messageApi]);

  // 当音频参数改变时，实时更新处理效果
  useEffect(() => {
    if (!formValues) return;
    if (audioContextRef.current && sourceRef.current && gainNodeRef.current && filterNodeRef.current) {
      const {
        volumeGain = 50,
        noiseReduction = 0,
        reverb = 0,
        decayTime = 50
      } = form.getFieldsValue();

      gainNodeRef.current.gain.setValueAtTime(
          ensureSafeAudioParam(volumeGain / 50, 1),
          audioContextRef.current.currentTime
      );
      filterNodeRef.current.frequency.setValueAtTime(
          ensureSafeAudioParam(Math.max(1000, 8000 - (noiseReduction * 70)), 4000),
          audioContextRef.current.currentTime
      );

      if (convolverRef.current) {
        const safeReverb = ensureSafeAudioParam(reverb, 0);
        if (safeReverb > 0) {
          const impulseBuffer = createReverbImpulse(
              audioContextRef.current,
              safeReverb,
              ensureSafeAudioParam(decayTime, 50)
          );
          convolverRef.current.buffer = impulseBuffer;
        }
        updateAudioChain();
      }
    }
  }, [formValues, form, updateAudioChain, createReverbImpulse]);

  // 预设配置处理
  const handlePresetChange = useCallback((preset: string) => {
    if (presetConfigs[preset]) {
      form.setFieldsValue({...presetConfigs[preset]});
    } else if (preset === '') {
      // 重置为默认的中性状态
      form.setFieldsValue(defaultFormValues);
    }
  }, [form, defaultFormValues]);

  // 主要音频处理函数
  const processAudio = useCallback(async (
      audioUrl: string,
      audioRef: React.RefObject<HTMLAudioElement | null>,
      startTime?: number,
      endTime?: number,
      onProcessed?: (processedAudio: Blob) => void
  ) => {
    try {
      if (!audioRef.current) {
        messageApi?.error('请先上传音频文件');
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const actualStartTime = startTime || 0;
      const actualEndTime = endTime || audioBuffer.duration;
      const startSample = Math.floor(actualStartTime * audioBuffer.sampleRate);
      const endSample = Math.floor(actualEndTime * audioBuffer.sampleRate);
      const cropLength = endSample - startSample;

      const croppedBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          cropLength,
          audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const croppedData = croppedBuffer.getChannelData(channel);
        for (let i = 0; i < cropLength; i++) {
          croppedData[i] = originalData[startSample + i];
        }
      }

      // 创建离线音频上下文进行处理
      const offlineContext = new OfflineAudioContext(
          croppedBuffer.numberOfChannels,
          croppedBuffer.length,
          croppedBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = croppedBuffer;

      // 获取当前表单的所有值
      const values = form.getFieldsValue();
      const {
        volumeGain = 50,
        noiseReduction = 0,
        reverb = 0,
        decayTime = 50,
        stereoWidth = 50,
        lowFreq = 0,
        midFreq = 0,
        highFreq = 0,
        clarity = 0,
        bassBoost = 0,
        // 新增参数
        voiceMidFreq = 50,
        highFreqSmooth = 50,
        lowFreqClear = 50
      } = values;

      // 创建音频处理节点
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = volumeGain / 50;

      // 降噪滤波器
      const noiseFilter = offlineContext.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = Math.max(1000, 8000 - (noiseReduction * 70));

      // 均衡器配置 - 使用配置映射优化
      const offlineFilterConfigs = [
        {
          name: 'lowEQ',
          type: 'peaking' as BiquadFilterType,
          frequency: 150,
          Q: 1,
          gain: lowFreq
        },
        {
          name: 'midEQ',
          type: 'peaking' as BiquadFilterType,
          frequency: 1000,
          Q: 1,
          gain: midFreq
        },
        {
          name: 'highEQ',
          type: 'peaking' as BiquadFilterType,
          frequency: 8000,
          Q: 1,
          gain: highFreq
        },
        {
          name: 'clarityEQ',
          type: 'highshelf' as BiquadFilterType,
          frequency: 6000,
          Q: undefined,
          gain: clarity * 0.2
        },
        // 专业调音器 - 增强低频通透感
        {
          name: 'lowClearEQ',
          type: 'peaking' as BiquadFilterType,
          frequency: 150 + (lowFreqClear - 50) * 3,
          Q: 1 + (lowFreqClear - 50) * 0.02,
          gain: (lowFreqClear - 50) * 0.1
        },
        // 专业调音器 - 增强人声清晰度
        {
          name: 'voiceClarityEQ',
          type: 'peaking' as BiquadFilterType,
          frequency: 3000 + (voiceMidFreq - 50) * 20,
          Q: 1.5 + (voiceMidFreq - 50) * 0.01,
          gain: (voiceMidFreq - 50) * 0.12
        },
        // 专业调音器 - 高频舒适度调节
        {
          name: 'highSmoothEQ',
          type: 'highshelf' as BiquadFilterType,
          frequency: 10000 + (100 - highFreqSmooth) * 40,
          Q: undefined,
          gain: (50 - highFreqSmooth) * 0.1
        }
      ];

      // 创建均衡器节点
      const eqNodes: { [key: string]: BiquadFilterNode } = {};
      offlineFilterConfigs.forEach(config => {
        const filter = offlineContext.createBiquadFilter();
        filter.type = config.type;
        filter.frequency.value = config.frequency;
        if (config.Q !== undefined) {
          filter.Q.value = config.Q;
        }
        if (config.gain !== undefined) {
          filter.gain.value = config.gain;
        }
        eqNodes[config.name] = filter;
      });

      const {
        lowEQ,
        midEQ,
        highEQ,
        clarityEQ,
        // 新增专业调音EQ
        lowClearEQ,
        voiceClarityEQ,
        highSmoothEQ
      } = eqNodes;

      // 压缩器
      const compressor = offlineContext.createDynamicsCompressor();
      const offlineCompressorConfig = {
        threshold: -24,
        knee: 30,
        ratio: 1 + (bassBoost / 100) * 12,
        attack: 0.003,
        release: 0.25
      };

      Object.entries(offlineCompressorConfig).forEach(([key, value]) => {
        (compressor as any)[key].value = value;
      });

      // 混响效果
      const convolver = offlineContext.createConvolver();
      if (reverb > 0) {
        const impulseBuffer = createReverbImpulse(offlineContext, reverb, decayTime);
        convolver.buffer = impulseBuffer;
      }

      // 连接音频处理链
      let currentNode: AudioNode = source;

      // 定义离线处理音频链顺序
      const offlineAudioChain = [
        noiseFilter,                // 基础降噪
        lowEQ,                      // 低频均衡
        midEQ,                      // 中频均衡
        highEQ,                     // 高频均衡
        clarityEQ,                  // 清晰度增强
        // 专业调音器
        lowClearEQ,                 // 低频通透感增强
        voiceClarityEQ,             // 人声清晰度增强
        highSmoothEQ,               // 高频舒适度调节
        compressor,                 // 基础压缩
        gainNode                    // 最终音量调整
      ];

      // 遍历连接音频处理链
      offlineAudioChain.forEach(node => {
        currentNode.connect(node);
        currentNode = node;
      });

      // 立体声宽度处理
      let finalNode: AudioNode = gainNode;
      if (stereoWidth !== 50) {
        const splitter = offlineContext.createChannelSplitter(2);
        const merger = offlineContext.createChannelMerger(2);
        const leftGain = offlineContext.createGain();
        const rightGain = offlineContext.createGain();

        const widthFactor = stereoWidth / 50;
        leftGain.gain.value = widthFactor;
        rightGain.gain.value = widthFactor;

        gainNode.connect(splitter);
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        finalNode = merger;
      }

      if (reverb > 0) {
        finalNode.connect(convolver);
        convolver.connect(offlineContext.destination);
      } else {
        finalNode.connect(offlineContext.destination);
      }

      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      // 输出格式处理 - 统一处理逻辑
      const wav = audioBufferToWav(renderedBuffer);
      const processedBlob = new Blob([wav], { type: 'audio/wav' });

      if (onProcessed) {
        onProcessed(processedBlob);
      }

      return processedBlob;
    } catch (error) {
      console.error('音频处理失败:', error);
      messageApi?.error('音频处理失败');
      throw error;
    }
  }, [form, createReverbImpulse, messageApi]);

  return {
    // 暴露表单
    form,
    // 方法
    createReverbImpulse,
    updateAudioChain,
    initAudioProcessing,
    handlePresetChange,
    processAudio,
    // 预设配置
    presetConfigs
  };
}; 