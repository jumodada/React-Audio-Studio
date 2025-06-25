import React, { useCallback, useState, useEffect } from 'react';
import { AudioTunerProps, AudioProcessingParams, AudioPreset, AudioProcessingError } from '../types';
import { useToneTuning } from '../hooks/useToneTuning';

export const AudioTuner: React.FC<AudioTunerProps> = ({
  audioUrl,
  initialParams,
  onAudioChange,
  onParamsChange,
  className,
  style
}) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string>('');

  const {
    params,
    isProcessing,
    updateParams,
    resetParams,
    applyPreset,
    processAudio,
    presetConfigs
  } = useToneTuning(audioUrl, initialParams, {
    onAudioChange: useCallback((audioUrl: string) => {
      setProcessedAudioUrl(audioUrl);
      onAudioChange?.(audioUrl);
    }, [onAudioChange]),
    onProcessingChange: useCallback((_processing: boolean) => {
      // 可以在这里添加处理状态变化的逻辑
    }, []),
    onError: useCallback((error: AudioProcessingError) => {
      setErrorMessage(error.message);
    }, [])
  });

  // 当参数变化时通知父组件
  useEffect(() => {
    onParamsChange?.(params);
  }, [params, onParamsChange]);

  // 初始处理音频
  useEffect(() => {
    if (audioUrl) {
      setErrorMessage('');
      processAudio();
    }
  }, [audioUrl, processAudio]);

  const handleParamChange = useCallback((key: keyof AudioProcessingParams, value: any) => {
    setErrorMessage('');
    updateParams({ [key]: value });
  }, [updateParams]);

  const handlePresetSelect = useCallback((preset: AudioPreset) => {
    setErrorMessage('');
    applyPreset(preset);
  }, [applyPreset]);

  const handleReset = useCallback(() => {
    setErrorMessage('');
    resetParams();
  }, [resetParams]);

  const formatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      clarity: '清晰度',
      volumeGain: '音量增益',
      reverb: '混响',
      decayTime: '衰减时间',
      stereoWidth: '立体声宽度',
      noiseReduction: '降噪',
      lowFreq: '低频均衡',
      midFreq: '中频均衡',
      highFreq: '高频均衡',
      bassBoost: '低音增强',
      voiceMidFreq: '人声清晰度',
      highFreqSmooth: '高频舒适度',
      lowFreqClear: '低频通透感'
    };
    return labels[key] || key;
  };

  const getSliderProps = (key: keyof AudioProcessingParams) => {
    const ranges: Record<string, { min: number; max: number; step: number }> = {
      clarity: { min: 0, max: 100, step: 1 },
      volumeGain: { min: 0, max: 100, step: 1 },
      reverb: { min: 0, max: 100, step: 1 },
      decayTime: { min: 0, max: 100, step: 1 },
      stereoWidth: { min: 0, max: 100, step: 1 },
      noiseReduction: { min: 0, max: 100, step: 1 },
      lowFreq: { min: -20, max: 20, step: 1 },
      midFreq: { min: -20, max: 20, step: 1 },
      highFreq: { min: -20, max: 20, step: 1 },
      bassBoost: { min: 0, max: 100, step: 1 },
      voiceMidFreq: { min: 0, max: 100, step: 1 },
      highFreqSmooth: { min: 0, max: 100, step: 1 },
      lowFreqClear: { min: 0, max: 100, step: 1 }
    };
    return ranges[key] || { min: 0, max: 100, step: 1 };
  };

  const sliderKeys: (keyof AudioProcessingParams)[] = [
    'clarity', 'volumeGain', 'noiseReduction', 'lowFreq', 'midFreq', 'highFreq',
    'bassBoost', 'voiceMidFreq', 'highFreqSmooth', 'lowFreqClear', 'reverb', 'stereoWidth'
  ];

  return (
    <div className={className} style={style}>
      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        {/* 预设选择 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
            音质预设
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Object.keys(presetConfigs).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset as AudioPreset)}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                {preset === 'standard' ? '标准' :
                 preset === 'recommended' ? '推荐' :
                 preset === 'highest' ? '最高' : '自定义'}
              </button>
            ))}
            <button
              onClick={handleReset}
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              重置
            </button>
          </div>
        </div>

        {/* 处理状态 */}
        {isProcessing && (
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#856404'
          }}>
            🔄 正在处理音频...
          </div>
        )}

        {/* 错误信息 */}
        {errorMessage && (
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#721c24'
          }}>
            ❌ {errorMessage}
          </div>
        )}

        {/* 输出格式选择 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
            输出格式
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: '8px' }}>格式:</label>
              <select
                value={params.outputFormat}
                onChange={(e) => handleParamChange('outputFormat', e.target.value)}
                disabled={isProcessing}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <option value="WAV">WAV</option>
                <option value="OPUS">OPUS</option>
                <option value="MP3">MP3</option>
              </select>
            </div>
            <div>
              <label style={{ marginRight: '8px' }}>采样率:</label>
              <select
                value={params.sampleRate}
                onChange={(e) => handleParamChange('sampleRate', e.target.value)}
                disabled={isProcessing}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <option value="22.05kHz">22.05kHz</option>
                <option value="44.1kHz">44.1kHz</option>
                <option value="48kHz">48kHz</option>
                <option value="96kHz">96kHz</option>
              </select>
            </div>
            <div>
              <label style={{ marginRight: '8px' }}>比特率:</label>
              <select
                value={params.bitRate}
                onChange={(e) => handleParamChange('bitRate', e.target.value)}
                disabled={isProcessing}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                <option value="32">32</option>
                <option value="64">64</option>
                <option value="128">128</option>
                <option value="160">160</option>
                <option value="192">192</option>
                <option value="256">256</option>
                <option value="320">320</option>
              </select>
            </div>
          </div>
        </div>

        {/* 音频调节滑块 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
            音频调节
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '15px'
          }}>
            {sliderKeys.map((key) => {
              const sliderProps = getSliderProps(key);
              const value = params[key] as number;
              
              return (
                <div key={key} style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span>{formatLabel(key)}</span>
                    <span style={{ color: '#666' }}>
                      {value}{key.includes('Freq') ? 'dB' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={sliderProps.min}
                    max={sliderProps.max}
                    step={sliderProps.step}
                    value={value}
                    onChange={(e) => handleParamChange(key, Number(e.target.value))}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      opacity: isProcessing ? 0.6 : 1
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px'
                  }}>
                    <span>{sliderProps.min}</span>
                    <span>{sliderProps.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 处理后音频播放 */}
        {processedAudioUrl && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              处理后音频预览:
            </div>
            <audio
              controls
              src={processedAudioUrl}
              style={{
                width: '100%'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 