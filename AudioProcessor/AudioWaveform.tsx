import React, { useCallback, useEffect } from 'react';
import { Button, Space, Card, Upload, Tag, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined,
  DownloadOutlined,
  ScissorOutlined,
  UploadOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { UploadFile } from 'antd/es/upload/interface';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioRecording } from './hooks/useAudioRecording';


interface AudioWaveformProps {
  audioUrl: string;
  onAudioCrop: () => void;
  initAudioProcessing: (audioElement: HTMLAudioElement) => void;
  onAudioGenerated: (audioUrl: string) => void;
  onClearAudio: () => void;
  audioPlayerHook?: any;
  // 新增的props以支持内部函数
  processAudio?: (startTime?: number, endTime?: number) => Promise<Blob | undefined>;
  outputFormat?: string;
  bitRate?: string;
  onSubmit?: (params: { file_url: string; file_type: string }) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  audioUrl, 
  onAudioCrop, 
  initAudioProcessing,
  onAudioGenerated,
  onClearAudio,
  audioPlayerHook,
  outputFormat = 'WAV',
  onRecordingStateChange,
}) => {

  const internalHook = useAudioPlayer(audioUrl);
  const {
    isPlaying,
    currentTime,
    duration,
    selectedSegment,
    audioRef,
    waveformRef,
    overviewRef,
    handlePlayPause,
    playSelectedSegment,
    handleZoomIn,
    handleZoomOut,
    handleTimeUpdate,
    handleLoadedMetadata,
    formatTime,
    formatTimePrecise,
    isValidSegment,
    setIsPlaying,
    processAudioForDownload,
  } = audioPlayerHook || internalHook;

  // 录音功能hook (已包含设备音频能力检测)
  const {
    isRecording,
    isRecordingReady,
    recordingDuration,
    isGettingPermission,
    recordingWaveRef,
    startRecording,
    stopRecording,
    maxSampleRate,
    isCapabilityLoading,
    formatSampleRate,
  } = useAudioRecording();

  // 通知上层录音状态变化
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

  // 处理导出 - 现在在组件内部
  const handleExport = useCallback(() => {
    processAudioForDownload(undefined, undefined, outputFormat);
  }, [processAudioForDownload, outputFormat]);

  // 处理音频上传
  const handleAudioUpload = (file: UploadFile) => {
    onClearAudio();
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const arrayBuffer = e.target.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: file.type || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        onAudioGenerated(url);
      }
    };
    reader.readAsArrayBuffer(file as any);
    
    return false;
  };

  return (
      <Card 
        title="音频波形" 
        extra={
          <Upload
            beforeUpload={handleAudioUpload}
            accept="audio/*"
            showUploadList={false}
            disabled={isRecording}
          >
            <Button icon={<UploadOutlined />} disabled={isRecording}>
              导入文件
            </Button>
          </Upload>
        }
        style={{ marginBottom: 24 }}
      >
        {/* 波形显示区域 - 音频波形和录音波形共用 */}
        <div style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 4 }}>
          {audioUrl ? (
            <>
              <div ref={overviewRef} style={{ height: 60, marginBottom: 16 }} />
              <div ref={waveformRef} style={{ height: 120 }} />
            </>
          ) : (
            <>
              <div style={{ height: 120, position: 'relative' }}>
                {/* 录音波形在这里显示 */}
                <div 
                  ref={recordingWaveRef} 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
                {!audioUrl && !isRecording && !isGettingPermission && (
                  <>
                    {/* 伪录音刻度线背景 */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      {/* 刻度线容器 */}
                      <div style={{
                        width: '90%',
                        height: '60%',
                        position: 'relative',
                        opacity: 0.3
                      }}>
                        {/* 生成多个刻度线 */}
                        {Array.from({ length: 50 }).map((_, index) => (
                          <div
                            key={index}
                            style={{
                              position: 'absolute',
                              left: `${(index / 49) * 100}%`,
                              top: '50%',
                              width: '1px',
                              height: `${Math.random() * 60 + 20}%`,
                              backgroundColor: '#1890ff',
                              transform: 'translateY(-50%)',
                              borderRadius: '1px'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* 提示文字 */}
                    <div style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center', 
                      color: '#999',
                      pointerEvents: 'none',
                      backgroundColor: 'rgba(248, 249, 250, 0.8)',
                      padding: '8px 16px',
                      borderRadius: '4px'
                    }}>
                      <div>音频波形区域</div>
                      <div style={{ fontSize: 11, color: '#1890ff', marginTop: 4 }}>
                        {isCapabilityLoading ? '正在检测音频能力...' : '高音质录音WAV+降噪+回声消除'}
                      </div>
                    </div>
                  </>
                )}
                {isGettingPermission && (
                  <div style={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', 
                    color: '#1890ff',
                    pointerEvents: 'none'
                  }}>
                    正在获取录音权限...
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* 选择区间显示 */}
          {isValidSegment(selectedSegment) && (
            <div style={{ 
              marginTop: 8, 
              padding: 8, 
              backgroundColor: '#e8f5e8', 
              borderRadius: 4,
              fontSize: 12,
              color: '#52c41a'
            }}>
              已选择区间: {formatTimePrecise(selectedSegment.startTime)} - {formatTimePrecise(selectedSegment.endTime)}
              （精确时长: {formatTimePrecise(selectedSegment.endTime - selectedSegment.startTime)}）
            </div>
          )}
        </div>
        
        {/* 播放控制区 - 无论有没有音频都显示 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 16 
        }}>
          <Space>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={() => handlePlayPause(initAudioProcessing)}
              disabled={!audioUrl}
            />
            {audioUrl && isValidSegment(selectedSegment) && (
              <Button
                type="default"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={() => playSelectedSegment(initAudioProcessing)}
                style={{ 
                  backgroundColor: '#e6f7ff',
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                区间播放
              </Button>
            )}
            {!isRecording && (
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </Space>
          
          <Space style={{ display: 'flex', alignItems: 'end' }}>
            {/* 设备音频能力提示 */}
            {!isCapabilityLoading && maxSampleRate && (
              <Tooltip 
                title={
                  <div>
                    <div>当前设备最大采样率: {formatSampleRate(maxSampleRate)}</div>
                    <div style={{ marginTop: 8, color: '#faad14' }}>
                      超出此采样率的配置将没有意义
                    </div>
                  </div>
                }
                placement="topLeft"
              >
                <Tag 
                  icon={<ExclamationCircleOutlined />} 
                  color="orange"
                  style={{ cursor: 'help' }}
                >
                  设备采样率: {formatSampleRate(maxSampleRate)}
                </Tag>
              </Tooltip>
            )}
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={!audioUrl} />
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={!audioUrl} />
            <Button
              color="green" variant="solid"
              icon={<PlayCircleOutlined />}
              onClick={() => startRecording(onClearAudio)}
              loading={isGettingPermission}
              disabled={isRecording}
            >
              {isGettingPermission ? '获取权限...' : '开始录音'}
            </Button>
            <Button
              type="primary"
              icon={<StopOutlined />}
              onClick={() => stopRecording(onAudioGenerated)}
              disabled={!isRecording || isGettingPermission}
              danger
            >
              停止录音
            </Button>
            
            <Button 
              icon={<ScissorOutlined />} 
              onClick={onAudioCrop} 
              disabled={!audioUrl || !isValidSegment(selectedSegment) || isRecording}
            >
              截取下载
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              disabled={!audioUrl || isRecording}
            >
              导出处理后的音频
            </Button>
          </Space>
        </div>

        {/* 录音状态显示 */}
        {isRecording && (
          <div style={{ 
            marginTop: 16, 
            padding: '8px 16px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            color: '#52c41a',
            textAlign: 'center'
          }}>
            正在录音... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
          </div>
        )}
        
        {/* 录音权限状态显示 */}
        {!isRecording && isRecordingReady && !audioUrl && (
          <div style={{ 
            marginTop: 16, 
            padding: '8px 16px', 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4,
            color: '#1890ff',
            textAlign: 'center'
          }}>
            录音权限已获取，可以开始录音
          </div>
        )}

        {/* 隐藏的音频元素 */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            style={{ display: 'none' }}
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('音频加载错误:', e);
              setIsPlaying(false);
            }}
          />
        )}
      </Card>
  );
};

export default AudioWaveform; 