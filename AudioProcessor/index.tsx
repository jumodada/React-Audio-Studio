import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Button, message } from 'antd';
import { AudioProcessing, AudioProcessingRef } from './AudioProcessing.tsx';
import { uploadFile } from '../../../api/verbalTricks.ts';

interface AudioProcessorProps {
  audioUrl?: string;
  onSubmit?: (params: { file_url: string; file_type: string }) => void;
  isEditMode?: boolean;
  visible?: boolean;
  onClose?: () => void;
  title?: string;
}

const AudioProcessor: React.FC<AudioProcessorProps> = ({
  audioUrl: initialAudioUrl,
  onSubmit,
  visible = false,
  onClose,
  title = "录音工作台"
}) => {
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl || '');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<{startTime: number, endTime: number} | null>(null);
  
  // AudioProcessing组件的ref
  const audioProcessingRef = useRef<AudioProcessingRef>(null);
  // 使用 useMessage hook
  const [messageApi, contextHolder] = message.useMessage();

  // 监听initialAudioUrl变化
  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  // 监听visible变化，当Modal打开时重新设置audioUrl和重置预设
  useEffect(() => {
    if (visible && initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    } else {
      setAudioUrl('');
    }
    // 每次打开/关闭Modal时重置预设选择
    setSelectedPreset('');
  }, [visible, initialAudioUrl]);

  // 清空音频函数 - 同时重置预设选择
  const clearAudio = useCallback(() => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl('');
    // 清空音频时重置预设选择
    setSelectedPreset('');
  }, [audioUrl]);

  // 处理音频生成 - 同时重置预设选择
  const handleAudioGenerated = useCallback((url: string) => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(url);
    // 生成新音频时重置预设选择
    setSelectedPreset('');
  }, [audioUrl]);

  // 处理录音状态变化
  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  // 处理关闭
  const handleClose = useCallback(() => {
    // 关闭Modal时清空当前音频
    clearAudio();
    if (onClose) {
      onClose();
    }
  }, [onClose, clearAudio]);

  // 处理提交 - 接收AudioProcessing组件提供的processedBlob和格式信息
  const handleSubmit = useCallback(async (processedBlob: Blob, outputFormat: string, bitRate: string) => {
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      const fileExtension = outputFormat === 'OPUS' ? 'opus' : outputFormat.toLowerCase();
      const qualityInfo = outputFormat === 'WAV' ? `${bitRate}bit` : `${bitRate}kbps`;
      formData.append('file', processedBlob, `processed_audio_${qualityInfo}.${fileExtension}`);
      
      const res = await uploadFile(formData);
      if (res.data && res.data.file_path) {
        const params = {
          file_url: res.data.file_path,
          file_type: fileExtension
        };
        
        if (onSubmit) {
          await onSubmit(params);
        }
        
        messageApi.success('音频处理并上传成功');
        // 提交成功后关闭Modal
        handleClose();
      } else {
        throw new Error('上传响应格式错误');
      }
    } catch (error) {
      console.error('提交失败:', error);
      messageApi.error('音频上传失败');
    } finally {
      setIsUploadingFile(false);
    }
  }, [onSubmit, messageApi, handleClose]);

  // 处理提交按钮点击
  const handleSubmitButtonClick = useCallback(async () => {
    if (audioProcessingRef.current) {
      await audioProcessingRef.current.submit();
    }
  }, []);

  // 处理截取提交按钮点击
  const handleCropSubmitButtonClick = useCallback(async () => {
    if (audioProcessingRef.current) {
      await audioProcessingRef.current.submitCrop();
    }
  }, []);

  // 处理音频片段选择变化
  const handleSegmentChange = useCallback((segment: {startTime: number, endTime: number} | null) => {
    setSelectedSegment(segment);
  }, []);

  // 检查是否有有效的选中片段
  const hasValidSegment = selectedSegment && (selectedSegment.endTime - selectedSegment.startTime) > 0;

  // 如果有visible prop，则渲染为Modal
  if (visible !== undefined) {
    return (
      <>
        {contextHolder}
        <Modal
          title={title}
          open={visible}
          destroyOnClose={true}
          maskClosable={false}
          onCancel={handleClose}
          footer={[
            <Button key="cancel" onClick={handleClose} disabled={isRecording || isUploadingFile}>
              取消
            </Button>,
            <Button
              key="submit"
              type="default"
              loading={isUploadingFile}
              disabled={isRecording || isUploadingFile || !audioUrl}
              onClick={handleSubmitButtonClick}
            >
              {isRecording ? '录音中...' : (isUploadingFile ? '上传中...' : '全音频提交')}
            </Button>,
              <Button
              key="cropSubmit"
              type="primary"
              loading={isUploadingFile}
              disabled={isRecording || isUploadingFile || !audioUrl || !hasValidSegment}
              onClick={handleCropSubmitButtonClick}
            >
              {isRecording ? '录音中...' : (isUploadingFile ? '上传中...' : '截取提交')}
            </Button>,
          ]}
          width={1400}
        >
          <div style={{ padding: 16, backgroundColor: '#f5f5f5', minHeight: '30vh' }}>
            <AudioProcessing
              ref={audioProcessingRef}
              audioUrl={audioUrl}
              onClearAudio={clearAudio}
              onSubmit={handleSubmit}
              onAudioGenerated={handleAudioGenerated}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              onRecordingStateChange={handleRecordingStateChange}
              onSegmentChange={handleSegmentChange}
            />
          </div>
        </Modal>
      </>
    );
  }

  // 否则渲染为普通组件
  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '30vh' }}>
        {/* 音频处理组件 */}
        <AudioProcessing
          ref={audioProcessingRef}
          audioUrl={audioUrl}
          onClearAudio={clearAudio}
          onSubmit={handleSubmit}
          onAudioGenerated={handleAudioGenerated}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          onRecordingStateChange={handleRecordingStateChange}
          onSegmentChange={handleSegmentChange}
        />
      </div>
    </>
  );
};

export default AudioProcessor; 