import React, { useCallback, useEffect, useState } from 'react';
import { AudioTunerProps, AudioProcessingParams, AudioPreset } from '../types';
import { useToneTuning } from '../hooks/useToneTuning';

export const AudioTuner: React.FC<AudioTunerProps> = ({
  audioUrl,
  initialParams,
  onAudioChange,
  onParamsChange,
  className,
  style
}) => {
  const { audio, isProcessing, updateParams, resetParams, exportAudio } = useToneTuning(
    audioUrl,
    initialParams
  );

  const [currentParams, setCurrentParams] = useState<AudioProcessingParams>({
    outputFormat: 'WAV',
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
    ...initialParams
  });

  // 监听音频变化
  useEffect(() => {
    if (onAudioChange && audio) {
      onAudioChange(audio);
    }
  }, [audio, onAudioChange]);

  // 监听参数变化
  useEffect(() => {
    if (onParamsChange) {
      onParamsChange(currentParams);
    }
  }, [currentParams, onParamsChange]);

  const handleParamChange = useCallback((key: keyof AudioProcessingParams, value: any) => {
    const newParams = { ...currentParams, [key]: value };
    setCurrentParams(newParams);
    updateParams({ [key]: value });
  }, [currentParams, updateParams]);

  const handlePresetChange = useCallback((preset: AudioPreset) => {
    // 预设配置映射
    const presets: Record<AudioPreset, Partial<AudioProcessingParams>> = {
      standard: {
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
      },
      custom: currentParams
    };

    const presetParams = presets[preset];
    const newParams = { ...currentParams, ...presetParams };
    setCurrentParams(newParams);
    updateParams(presetParams);
  }, [currentParams, updateParams]);

  const handleReset = useCallback(() => {
    resetParams();
    setCurrentParams({
      outputFormat: 'WAV',
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
    });
  }, [resetParams]);

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportAudio();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tuned_audio.${currentParams.outputFormat.toLowerCase()}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出音频失败:', error);
    }
  }, [exportAudio, currentParams.outputFormat]);

  const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
  }> = ({ label, value, min, max, step = 1, onChange, unit = '' }) => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px'
      }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>{label}</label>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: '#ddd',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );

  const SelectControl: React.FC<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
  }> = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '14px', 
        fontWeight: '500',
        marginBottom: '5px'
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={className} style={style}>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        {/* 头部控制区 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>音频调音器</h3>
            {isProcessing && (
              <div style={{
                color: '#007bff',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  animation: 'pulse 1s infinite'
                }} />
                处理中...
              </div>
            )}
          </div>

          {/* 预设和控制按钮 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '15px'
          }}>
            <button
              onClick={() => handlePresetChange('standard')}
              style={{
                padding: '8px 16px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              标准模式
            </button>
            <button
              onClick={() => handlePresetChange('recommended')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              推荐模式
            </button>
            <button
              onClick={() => handlePresetChange('highest')}
              style={{
                padding: '8px 16px',
                border: '1px solid #28a745',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#28a745',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              最高质量
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重置
            </button>
            <button
              onClick={handleExport}
              disabled={!audio || isProcessing}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: audio && !isProcessing ? '#28a745' : '#ccc',
                color: 'white',
                cursor: audio && !isProcessing ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              导出音频
            </button>
          </div>

          {/* 音频预览 */}
          {audio && (
            <div style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                调音后预览:
              </div>
              <audio
                controls
                src={audio}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* 参数调节区 */}
        <div style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* 基础设置 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>基础设置</h4>
            
            <SelectControl
              label="输出格式"
              value={currentParams.outputFormat}
              options={['WAV', 'OPUS', 'MP3']}
              onChange={(value) => handleParamChange('outputFormat', value as any)}
            />
            
            <SelectControl
              label="采样率"
              value={currentParams.sampleRate}
              options={['22.05kHz', '44.1kHz', '48kHz', '96kHz']}
              onChange={(value) => handleParamChange('sampleRate', value as any)}
            />
            
            <SelectControl
              label="比特率"
              value={currentParams.bitRate}
              options={['32', '64', '128', '160', '192', '256', '320']}
              onChange={(value) => handleParamChange('bitRate', value)}
            />
          </div>

          {/* 音质增强 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>音质增强</h4>
            
            <SliderControl
              label="清晰度"
              value={currentParams.clarity}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('clarity', value)}
            />
            
            <SliderControl
              label="音量增益"
              value={currentParams.volumeGain}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('volumeGain', value)}
            />
            
            <SliderControl
              label="降噪强度"
              value={currentParams.noiseReduction}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('noiseReduction', value)}
            />
            
            <SliderControl
              label="低音增强"
              value={currentParams.bassBoost}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('bassBoost', value)}
            />
          </div>

          {/* 均衡器 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>均衡器</h4>
            
            <SliderControl
              label="低频"
              value={currentParams.lowFreq}
              min={-20}
              max={20}
              onChange={(value) => handleParamChange('lowFreq', value)}
              unit="dB"
            />
            
            <SliderControl
              label="中频"
              value={currentParams.midFreq}
              min={-20}
              max={20}
              onChange={(value) => handleParamChange('midFreq', value)}
              unit="dB"
            />
            
            <SliderControl
              label="高频"
              value={currentParams.highFreq}
              min={-20}
              max={20}
              onChange={(value) => handleParamChange('highFreq', value)}
              unit="dB"
            />
          </div>

          {/* 专业调音 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>专业调音</h4>
            
            <SliderControl
              label="人声清晰度"
              value={currentParams.voiceMidFreq}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('voiceMidFreq', value)}
            />
            
            <SliderControl
              label="高频舒适度"
              value={currentParams.highFreqSmooth}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('highFreqSmooth', value)}
            />
            
            <SliderControl
              label="低频通透感"
              value={currentParams.lowFreqClear}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('lowFreqClear', value)}
            />
            
            <SliderControl
              label="立体声宽度"
              value={currentParams.stereoWidth}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('stereoWidth', value)}
            />
          </div>

          {/* 空间效果 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>空间效果</h4>
            
            <SliderControl
              label="混响强度"
              value={currentParams.reverb}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('reverb', value)}
            />
            
            <SliderControl
              label="衰减时间"
              value={currentParams.decayTime}
              min={0}
              max={100}
              onChange={(value) => handleParamChange('decayTime', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 