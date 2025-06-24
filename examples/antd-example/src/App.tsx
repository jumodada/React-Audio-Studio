import React, { useState, useRef } from 'react';
import { 
  Layout, 
  Card, 
  Button, 
  Slider, 
  Select, 
  Row, 
  Col, 
  Space, 
  Typography, 
  message,
  Divider,
  Progress,
  Tabs
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RecordStartOutlined,
  StopOutlined,
  UploadOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import {
  useAudioRecording,
  useAudioPlayer,
  useAudioProcessing,
  useDeviceAudioCapabilities
} from '@react-audio-studio/core';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [audioUrl, setAudioUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用录音功能
  const recording = useAudioRecording({
    onError: (error) => messageApi.error(error),
    onSuccess: (msg) => messageApi.success(msg),
  });

  // 使用播放器功能
  const player = useAudioPlayer({
    onError: (error) => messageApi.error(error),
    onSuccess: (msg) => messageApi.success(msg),
  });

  // 使用音频处理功能
  const processor = useAudioProcessing({
    onError: (error) => messageApi.error(error),
    onSuccess: (msg) => messageApi.success(msg),
  });

  // 使用设备检测功能
  const deviceCapabilities = useDeviceAudioCapabilities();

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      player.loadAudio(url);
    }
  };

  // 开始录音
  const handleStartRecording = () => {
    recording.startRecording(() => {
      setAudioUrl('');
      player.cleanup();
    });
  };

  // 停止录音
  const handleStopRecording = () => {
    recording.stopRecording((url) => {
      setAudioUrl(url);
      player.loadAudio(url);
    });
  };

  // 处理音频
  const handleProcessAudio = async () => {
    if (!audioUrl) {
      messageApi.warning('请先录制或上传音频文件');
      return;
    }

    try {
      const processedBlob = await processor.processAudio(audioUrl);
      const processedUrl = URL.createObjectURL(processedBlob);
      setAudioUrl(processedUrl);
      player.loadAudio(processedUrl);
      messageApi.success('音频处理完成');
    } catch (error) {
      messageApi.error('音频处理失败');
    }
  };

  // 下载音频
  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `processed_audio_${Date.now()}.${processor.params.outputFormat}`;
    a.click();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          🎵 React Audio Studio
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
          {/* 设备信息卡片 */}
          <Col xs={24} lg={8}>
            <Card title="设备信息" extra={<SettingOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>最大采样率: {deviceCapabilities.formatSampleRate(deviceCapabilities.maxSampleRate)}</Text>
                <Text>支持格式: {deviceCapabilities.supportedFormats.join(', ')}</Text>
                <Text>音频上下文: {deviceCapabilities.deviceInfo.audioContext ? '✅' : '❌'}</Text>
                <Text>录音器: {deviceCapabilities.deviceInfo.mediaRecorder ? '✅' : '❌'}</Text>
              </Space>
            </Card>
          </Col>

          {/* 录音控制卡片 */}
          <Col xs={24} lg={8}>
            <Card title="录音控制" extra={<RecordStartOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div ref={recording.recordingWaveRef} style={{ height: '60px', background: '#f5f5f5' }} />
                <Text>录音时长: {recording.formatRecordingTime(recording.recordingDuration)}</Text>
                <Space>
                  <Button
                    type="primary"
                    icon={<RecordStartOutlined />}
                    onClick={handleStartRecording}
                    disabled={recording.isRecording}
                    loading={recording.isGettingPermission}
                  >
                    {recording.isGettingPermission ? '获取权限中...' : '开始录音'}
                  </Button>
                  <Button
                    icon={<StopOutlined />}
                    onClick={handleStopRecording}
                    disabled={!recording.isRecording}
                  >
                    停止录音
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* 文件上传卡片 */}
          <Col xs={24} lg={8}>
            <Card title="文件上传" extra={<UploadOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  type="dashed"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  block
                >
                  选择音频文件
                </Button>
                {audioUrl && (
                  <Text type="success">✅ 音频文件已加载</Text>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          {/* 音频播放器 */}
          <Col xs={24} lg={12}>
            <Card title="音频播放器" extra={<PlayCircleOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text>{player.formatTime(player.currentTime)}</Text>
                  <Text>{player.formatTime(player.duration)}</Text>
                </Row>
                
                <Slider
                  min={0}
                  max={player.duration || 1}
                  step={0.1}
                  value={player.currentTime}
                  onChange={player.setCurrentTime}
                  disabled={!audioUrl}
                />
                
                <Row justify="center">
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      icon={player.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      onClick={player.togglePlay}
                      disabled={!audioUrl || player.isLoading}
                    >
                      {player.isPlaying ? '暂停' : '播放'}
                    </Button>
                  </Space>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text>音量</Text>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={player.volume}
                      onChange={player.setVolume}
                    />
                  </Col>
                  <Col span={12}>
                    <Text>播放速度</Text>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={player.playbackRate}
                      onChange={player.setPlaybackRate}
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>

          {/* 音频处理 */}
          <Col xs={24} lg={12}>
            <Card title="音频处理" extra={<SettingOutlined />}>
              <Tabs
                items={[
                  {
                    key: 'presets',
                    label: '预设',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Select
                          placeholder="选择音频预设"
                          style={{ width: '100%' }}
                          onChange={processor.applyPreset}
                        >
                          {processor.presetOptions.map(preset => (
                            <Option key={preset} value={preset}>
                              {preset === 'standard' ? '标准' : 
                               preset === 'recommended' ? '推荐' : '最高质量'}
                            </Option>
                          ))}
                        </Select>
                        
                        <Row gutter={16}>
                          <Col span={8}>
                            <Text>输出格式</Text>
                            <Select
                              value={processor.params.outputFormat}
                              onChange={(value) => processor.updateParams({ outputFormat: value })}
                              style={{ width: '100%' }}
                            >
                              <Option value="wav">WAV</Option>
                              <Option value="mp3">MP3</Option>
                              <Option value="opus">OPUS</Option>
                            </Select>
                          </Col>
                          <Col span={8}>
                            <Text>采样率</Text>
                            <Select
                              value={processor.params.sampleRate}
                              onChange={(value) => processor.updateParams({ sampleRate: value })}
                              style={{ width: '100%' }}
                            >
                              <Option value="44.1kHz">44.1kHz</Option>
                              <Option value="48kHz">48kHz</Option>
                              <Option value="96kHz">96kHz</Option>
                            </Select>
                          </Col>
                          <Col span={8}>
                            <Text>比特率</Text>
                            <Select
                              value={processor.params.bitRate}
                              onChange={(value) => processor.updateParams({ bitRate: value })}
                              style={{ width: '100%' }}
                            >
                              <Option value="128">128kbps</Option>
                              <Option value="192">192kbps</Option>
                              <Option value="320">320kbps</Option>
                            </Select>
                          </Col>
                        </Row>
                      </Space>
                    ),
                  },
                  {
                    key: 'effects',
                    label: '效果调节',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Text>音量增益</Text>
                            <Slider
                              min={0}
                              max={100}
                              value={processor.params.volumeGain}
                              onChange={(value) => processor.updateParams({ volumeGain: value })}
                            />
                          </Col>
                          <Col span={12}>
                            <Text>清晰度</Text>
                            <Slider
                              min={0}
                              max={100}
                              value={processor.params.clarity}
                              onChange={(value) => processor.updateParams({ clarity: value })}
                            />
                          </Col>
                        </Row>
                        
                        <Row gutter={16}>
                          <Col span={12}>
                            <Text>降噪</Text>
                            <Slider
                              min={0}
                              max={100}
                              value={processor.params.noiseReduction}
                              onChange={(value) => processor.updateParams({ noiseReduction: value })}
                            />
                          </Col>
                          <Col span={12}>
                            <Text>立体声宽度</Text>
                            <Slider
                              min={0}
                              max={100}
                              value={processor.params.stereoWidth}
                              onChange={(value) => processor.updateParams({ stereoWidth: value })}
                            />
                          </Col>
                        </Row>
                      </Space>
                    ),
                  },
                ]}
              />
              
              <Divider />
              
              <Row justify="space-between">
                <Button onClick={processor.resetParams}>
                  重置参数
                </Button>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleProcessAudio}
                    disabled={!audioUrl}
                  >
                    处理音频
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadAudio}
                    disabled={!audioUrl}
                  >
                    下载
                  </Button>
                </Space>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App; 