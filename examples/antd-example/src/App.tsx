import React, { useState, useRef, useCallback } from 'react';
import { 
  Layout, 
  Card, 
  Button, 
  Row, 
  Col, 
  Space, 
  Typography, 
  message,
  Divider,
  Upload,
  Tabs
} from 'antd';
import {
  PlayCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  SettingOutlined,
  SoundOutlined
} from '@ant-design/icons';
import {
  AudioRecorder,
  AudioWaveform,
  AudioTuner,
  useToneTuning,
  useDeviceAudioCapabilities,
  type RecordingState,
  type AudioSegment
} from '@react-audio-studio/core';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<AudioSegment | null>(null);
  const waveformRef = useRef<any>(null);

  // 使用调音功能 - 核心功能
  const toneTuning = useToneTuning(audioUrl, {
    clarity: 85,
    volumeGain: 95,
    reverb: 0,
    noiseReduction: 20
  });

  // 使用设备检测功能
  const deviceCapabilities = useDeviceAudioCapabilities();

  // 处理录音完成
  const handleRecordingComplete = useCallback((url: string, blob: Blob) => {
    setAudioUrl(url);
    setProcessedAudioUrl('');
    messageApi.success('录音完成！');
  }, [messageApi]);

  // 处理录音状态变化
  const handleRecordingStateChange = useCallback((state: RecordingState) => {
    if (!state.isRecording && !state.audioUrl) {
      // 录音被清除或重置时，清除之前的音频
      setAudioUrl('');
      setProcessedAudioUrl('');
    }
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setProcessedAudioUrl('');
    messageApi.success('文件上传成功！');
    return false; // 阻止默认上传行为
  }, [messageApi]);

  // 处理调音后的音频变化
  const handleTunedAudioChange = useCallback((audio: string) => {
    setProcessedAudioUrl(audio);
  }, []);

  // 处理片段选择
  const handleSegmentSelect = useCallback((segment: AudioSegment | null) => {
    setSelectedSegment(segment);
  }, []);

  // 下载原始音频
  const handleDownloadOriginal = useCallback(() => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `original_audio_${Date.now()}.wav`;
    a.click();
  }, [audioUrl]);

  // 下载处理后音频
  const handleDownloadProcessed = useCallback(async () => {
    try {
      const blob = await toneTuning.exportAudio();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_audio_${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
        messageApi.success('音频导出成功！');
      }
    } catch (error) {
      messageApi.error('音频导出失败');
    }
  }, [toneTuning, messageApi]);

  const TabItems = [
    {
      key: 'recorder',
      label: (
        <span>
          <SoundOutlined />
          录音器
        </span>
      ),
      children: (
        <Card>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStateChange={handleRecordingStateChange}
          />
        </Card>
      ),
    },
    {
      key: 'upload',
      label: (
        <span>
          <UploadOutlined />
          文件上传
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Upload
              beforeUpload={handleFileUpload}
              accept="audio/*"
              showUploadList={false}
            >
              <Button 
                size="large" 
                icon={<UploadOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
              >
                点击或拖拽音频文件到此处
              </Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
              支持 MP3、WAV、M4A 等格式
            </Text>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {contextHolder}
      
      <Header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0, color: 'white' }}>
            🎵 React Audio Studio
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            专业音频录制与调音工作台
          </Text>
        </div>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        {/* 设备信息栏 */}
        <Card 
          size="small" 
          style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.9)' }}
        >
          <Row gutter={16} align="middle">
            <Col>
              <SettingOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            </Col>
            <Col>
              <Text strong>设备状态:</Text>
            </Col>
            <Col>
              <Text>最大采样率: {deviceCapabilities.formatSampleRate(deviceCapabilities.maxSampleRate)}</Text>
            </Col>
            <Col>
              <Text>支持格式: {deviceCapabilities.supportedFormats.join(', ')}</Text>
            </Col>
            <Col>
              <Text>音频上下文: {deviceCapabilities.deviceInfo.audioContext ? '✅' : '❌'}</Text>
            </Col>
            <Col>
              <Text>录音器: {deviceCapabilities.deviceInfo.mediaRecorder ? '✅' : '❌'}</Text>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* 左侧：音频输入 */}
          <Col xs={24} lg={8}>
            <Card title="音频输入" style={{ height: '100%' }}>
              <Tabs items={TabItems} />
            </Card>
          </Col>

          {/* 右侧：波形显示和调音 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 波形显示区 */}
              {audioUrl && (
                <Card 
                  title="音频波形" 
                  extra={
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadOriginal}
                        size="small"
                      >
                        下载原音频
                      </Button>
                      {processedAudioUrl && (
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadProcessed}
                          size="small"
                        >
                          下载调音后
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <AudioWaveform
                    ref={waveformRef}
                    audioUrl={audioUrl}
                    height={140}
                    onSegmentSelect={handleSegmentSelect}
                  />
                  
                  {selectedSegment && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#f6ffed', 
                      border: '1px solid #b7eb8f',
                      borderRadius: '6px'
                    }}>
                      <Text>
                        已选择区间: {selectedSegment.startTime.toFixed(2)}s - {selectedSegment.endTime.toFixed(2)}s
                        （时长: {(selectedSegment.endTime - selectedSegment.startTime).toFixed(2)}s）
                      </Text>
                    </div>
                  )}
                </Card>
              )}

              {/* 实时调音面板 */}
              {audioUrl && (
                <Card 
                  title="实时调音器" 
                  extra={
                    <Space>
                      {toneTuning.isProcessing && (
                        <Text type="secondary">处理中...</Text>
                      )}
                      <Button onClick={toneTuning.resetParams} size="small">
                        重置参数
                      </Button>
                    </Space>
                  }
                >
                  <AudioTuner
                    audioUrl={audioUrl}
                    onAudioChange={handleTunedAudioChange}
                  />
                </Card>
              )}

              {/* 对比播放区 */}
              {processedAudioUrl && (
                <Card title="音频对比">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text strong>原始音频:</Text>
                      </div>
                      <audio
                        controls
                        src={audioUrl}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text strong>调音后音频:</Text>
                      </div>
                      <audio
                        controls
                        src={processedAudioUrl}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                </Card>
              )}
            </Space>
          </Col>
        </Row>

        {/* 使用提示 */}
        {!audioUrl && (
          <Card 
            style={{ 
              marginTop: '24px', 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            <div style={{ textAlign: 'center', color: 'white' }}>
              <Title level={3} style={{ color: 'white', marginBottom: '16px' }}>
                🎤 开始您的音频之旅
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                录制新音频或上传现有文件，然后使用我们强大的实时调音功能优化您的音频质量
              </Text>
            </div>
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default App; 