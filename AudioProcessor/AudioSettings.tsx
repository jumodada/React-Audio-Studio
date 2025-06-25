import React, { useState } from 'react';
import { Row, Col, Card, Select, Slider, Button, Form } from 'antd';
import { 
  SoundOutlined, 
  ThunderboltOutlined, 
  CrownOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  AudioOutlined
} from '@ant-design/icons';
import { useAudioOptions } from './hooks/useAudioOptions';
import { useAudioProcessing } from './hooks/useAudioProcessing';

const { Option } = Select;

interface AudioSettingsProps {
  processingHook: ReturnType<typeof useAudioProcessing>;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  disabled?: boolean;
}

const AudioSettings: React.FC<AudioSettingsProps> = ({ processingHook, selectedPreset, onPresetChange, disabled = false }) => {
  const { formatOptions, sampleRateOptions, getBitRateOptions, sliderMarks, presetConfigs } = useAudioOptions();
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  // 获取Form实例
  const { form } = processingHook;
  
  // 使用Form.useWatch监听表单值变化
  const outputFormat = Form.useWatch('outputFormat', form);
  const bitRateOptions = getBitRateOptions(outputFormat);

  // 图标映射表，使用 Map 替代 switch
  const iconMap = new Map([
    ['SoundOutlined', <SoundOutlined style={{ fontSize: 32, marginBottom: 8, color: '#1890ff' }} />],
    ['ThunderboltOutlined', <ThunderboltOutlined style={{ fontSize: 32, marginBottom: 8, color: '#f5222d' }} />],
    ['CrownOutlined', <CrownOutlined style={{ fontSize: 32, marginBottom: 8, color: '#fa8c16' }} />],
    ['VideoCameraOutlined', <VideoCameraOutlined style={{ fontSize: 32, marginBottom: 8, color: '#52c41a' }} />],
    ['AudioOutlined', <AudioOutlined style={{ fontSize: 32, marginBottom: 8, color: '#722ed1' }} />]
  ]);

  const getIcon = (iconName: string) => {
    return iconMap.get(iconName) || <SoundOutlined style={{ fontSize: 32, marginBottom: 8 }} />;
  };

  // 高级模式卡片配置
  const advancedCards = [
    {
      title: "格式/音质设置",
      fields: [
        {
          name: "outputFormat",
          label: "输出格式",
          type: "select",
          options: formatOptions
        },
        {
          name: "sampleRate", 
          label: "采样率",
          type: "select",
          options: sampleRateOptions
        },
        {
          name: "bitRate",
          label: outputFormat === 'MP3' ? '比特率' : '位深度',
          type: "select",
          options: bitRateOptions
        }
      ]
    },
    {
      title: "音频增强",
      fields: [
        {
          name: "noiseReduction",
          label: "降噪级别", 
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.noiseReduction
        },
        {
          name: "volumeGain",
          label: "音量增益",
          type: "slider", 
          min: 0,
          max: 100,
          marks: sliderMarks.volumeGain
        },
        {
          name: "clarity",
          label: "清晰度",
          type: "slider",
          min: 0,
          max: 100, 
          marks: sliderMarks.clarity
        }
      ]
    },
    {
      title: "环境设置",
      fields: [
        {
          name: "reverb",
          label: "混响度",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.reverb
        },
        {
          name: "decayTime",
          label: "衰减时间",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.decayTime
        },
        {
          name: "stereoWidth",
          label: "立体声宽度",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.stereoWidth
        }
      ]
    },
    {
      title: "均衡器",
      fields: [
        {
          name: "lowFreq",
          label: "低频 (60-250Hz)",
          type: "slider",
          min: -12,
          max: 12,
          step: 1,
          marks: sliderMarks.equalizer
        },
        {
          name: "midFreq",
          label: "中频 (250-2000Hz)",
          type: "slider",
          min: -12,
          max: 12,
          step: 1,
          marks: sliderMarks.equalizer
        },
        {
          name: "highFreq",
          label: "高频 (2000-20000Hz)",
          type: "slider",
          min: -12,
          max: 12,
          step: 1,
          marks: sliderMarks.equalizer
        },
        {
          name: "bassBoost",
          label: "音频压缩比",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.bassBoost
        }
      ]
    },
    {
      title: "专业调音",
      fields: [
        {
          name: "voiceMidFreq",
          label: "人声清晰度 (1k-4kHz)",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.voiceClarity
        },
        {
          name: "highFreqSmooth",
          label: "高频舒适度",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.highFreqSmooth
        },
        {
          name: "lowFreqClear",
          label: "低频通透感",
          type: "slider",
          min: 0,
          max: 100,
          marks: sliderMarks.lowFreqClear
        }
      ]
    }
  ];

  // 渲染表单项的通用函数
  const renderFormItem = (field: any) => {
    const commonProps = {
      name: field.name,
      label: field.label,
      style: { marginBottom: 12 }
    };

    if (field.type === 'select') {
      return (
        <Form.Item key={field.name} {...commonProps}>
          <Select style={{ width: '100%' }}>
            {field.options?.map((option: any) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      );
    }

    if (field.type === 'slider') {
      return (
        <Form.Item key={field.name} {...commonProps}>
          <Slider
            min={field.min}
            max={field.max}
            step={field.step}
            marks={field.marks}
            style={{ width: '85%', marginLeft: '7%' }}
          />
        </Form.Item>
      );
    }

    return null;
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>音频处理设置</span>
          <Button 
            type={isAdvancedMode ? "primary" : "default"}
            icon={<SettingOutlined />}
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            size="small"
            disabled={disabled}
          >
            {isAdvancedMode ? '简单模式' : '高级设置'}
          </Button>
        </div>
      }
      style={{ marginBottom: 24, position: 'relative' }}
    >
      {/* 简单模式 - 使用display控制显示/隐藏 */}
      <div style={{ display: isAdvancedMode ? 'none' : 'block' }}>
        <div style={{ marginBottom: 16, color: '#666', textAlign: 'center' }}>
          {selectedPreset ? 
            `已选择 "${presetConfigs.find(p => p.key === selectedPreset)?.title}" 预设` : 
            '选择音质预设，系统将自动优化所有参数'
          }
        </div>
        <Row gutter={16}>
          {presetConfigs.map((preset) => (
            <Col span={8} key={preset.key}>
              <Card
                hoverable
                className={`preset-card ${selectedPreset === preset.key ? 'preset-selected' : ''}`}
                style={{
                  textAlign: 'center',
                  border: `2px solid ${selectedPreset === preset.key ? '#52c41a' : 'transparent'}`,
                  boxSizing: 'border-box',
                  boxShadow: selectedPreset === preset.key ? 'none' : '0 0 0 1px #d9d9d9',
                  backgroundColor: selectedPreset === preset.key ? '#f6ffed' : '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1
                }}
                onClick={() => !disabled && onPresetChange(preset.key)}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {getIcon(preset.icon)}
                </div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 500, 
                  marginBottom: 8, 
                  color: preset.isRecommended ? '#f5222d' : undefined 
                }}>
                  {preset.title} {preset.isRecommended && '⭐'}
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                  {preset.description.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        {/* 当选择了预设时，显示重置按钮 */}
        {selectedPreset && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button 
              size="small" 
              onClick={() => onPresetChange('')}
              disabled={disabled}
              style={{ color: '#666' }}
            >
              重置为默认设置
            </Button>
          </div>
        )}
      </div>

      {/* 高级模式 - 使用数组遍历渲染卡片 */}
      <div style={{ display: isAdvancedMode ? 'block' : 'none' }}>
        <style>
          {`
            .ant-form-item-label > label {
              font-weight: bold !important;
            }
          `}
        </style>
        <Form 
          size='small' 
          form={form} 
          layout="vertical"
        >
        <Row gutter={12}>
          <Col span={24}>
            <Row gutter={12}>
              {advancedCards.map((card, index) => (
                <Col span={8} key={index}>
                  <Card title={card.title} style={{ height: 450, marginBottom: 12 }}>
                    {card.fields.map((field) => renderFormItem(field))}
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Form>
      </div>

      {/* 遮罩层 */}
      {disabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: '#333',
              fontSize: 16
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <SoundOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
            </div>
            <div>请先上传或录制音频文件</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>才能进行音频处理设置</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AudioSettings; 