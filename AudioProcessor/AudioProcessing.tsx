import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Form, message } from 'antd';
import { useAudioProcessing } from './hooks/useAudioProcessing.ts';
import { useAudioPlayer } from './hooks/useAudioPlayer.ts';
import AudioWaveform from './AudioWaveform.tsx';
import AudioSettings from './AudioSettings.tsx';

// 定义ref暴露的方法
export interface AudioProcessingRef {
  submit: () => Promise<void>;
  submitCrop: () => Promise<void>;
}

// 音频处理组件
export const AudioProcessing = forwardRef<
  AudioProcessingRef,
  {
    audioUrl: string;
    onClearAudio: () => void;
    onSubmit?: (processedBlob: Blob, outputFormat: string, bitRate: string) => Promise<void>;
    onAudioGenerated: (audioUrl: string) => void;
    selectedPreset: string;
    setSelectedPreset: (preset: string) => void;
    onRecordingStateChange?: (isRecording: boolean) => void;
    onSegmentChange?: (segment: {startTime: number, endTime: number} | null) => void;
  }
>(({ audioUrl, onSubmit, onAudioGenerated, onClearAudio, selectedPreset, setSelectedPreset, onRecordingStateChange, onSegmentChange }, ref) => {
    
    // 使用 useMessage hook
    const [messageApi, contextHolder] = message.useMessage();
    
    const audioProcessingHook = useAudioProcessing(messageApi);
    const {
      form,
      initAudioProcessing,
      handlePresetChange,
      processAudio: processAudioFromHook
    } = audioProcessingHook;
    
    const presetInitializedRef = useRef(false);
    
    const outputFormat = Form.useWatch('outputFormat', form);
    const bitRate = Form.useWatch('bitRate', form);
  
    const audioPlayerHook = useAudioPlayer(audioUrl);
    const { 
      selectedSegment, 
      isValidSegment, 
      audioRef, 
      processAudioForDownload,
    } = audioPlayerHook;
  
    // 监听音频URL变化，重新初始化音频处理
    useEffect(() => {
      if (audioUrl && audioRef.current) {
        const audioElement = audioRef.current;
        
        const handleLoadedMetadata = () => {
          initAudioProcessing(audioElement, true); // 强制重新初始化
        };
        
        if (audioElement.readyState >= 1) {
          // 如果已经加载了metadata，直接初始化
          initAudioProcessing(audioElement, true);
        } else {
          audioElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        }
        return () => {
          // 清理事件监听器
          audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }, [audioUrl, initAudioProcessing, audioRef]);
  
    // 监听选中片段变化，通知父组件
    useEffect(() => {
      if (onSegmentChange) {
        onSegmentChange(selectedSegment);
      }
    }, [selectedSegment, onSegmentChange]);
  
    // 包装 processAudio 函数以符合原始接口
    const processAudio = useCallback(async (startTime?: number, endTime?: number) => {
      return await processAudioFromHook(audioUrl, audioRef, startTime, endTime);
    }, [processAudioFromHook, audioUrl, audioRef]);
  
    // 包装 initAudioProcessing 函数以符合播放器要求的接口
    const wrappedInitAudioProcessing = useCallback((audioElement: HTMLAudioElement) => {
      initAudioProcessing(audioElement, false); // 播放时不强制重新初始化
    }, [initAudioProcessing]);
  
    // 处理音频截取 - 只下载，不保存
    const handleAudioCrop = useCallback(() => {
      if (!isValidSegment(selectedSegment)) {
        messageApi.warning('请先选择要截取的音频区间');
        return;
      }
      
      processAudioForDownload(selectedSegment.startTime, selectedSegment.endTime, outputFormat);
    }, [selectedSegment, isValidSegment, messageApi, processAudioForDownload, outputFormat]);
  
    // 提交处理后的音频 - 只处理音频，不上传
    const handleSubmit = useCallback(async () => {
      try {
        const processedBlob = await processAudio();
        if (!processedBlob) {
          throw new Error('音频处理失败');
        }
        
        // 将处理后的音频数据和格式信息传递给父组件
        if (onSubmit) {
          await onSubmit(processedBlob, outputFormat, bitRate);
        }
      } catch (error) {
        console.error('音频处理失败:', error);
        messageApi.error('音频处理失败');
      }
    }, [processAudio, outputFormat, bitRate, onSubmit, messageApi]);

    // 提交截取的音频 - 只截取选定区间的音频
    const handleSubmitCrop = useCallback(async () => {
      if (!isValidSegment(selectedSegment)) {
        messageApi.warning('请先选择要截取的音频区间');
        return;
      }
      
      try {
        const processedBlob = await processAudio(selectedSegment.startTime, selectedSegment.endTime);
        if (!processedBlob) {
          throw new Error('音频截取失败');
        }
        
        // 将截取的音频数据和格式信息传递给父组件
        if (onSubmit) {
          await onSubmit(processedBlob, outputFormat, bitRate);
        }
      } catch (error) {
        console.error('音频截取失败:', error);
        messageApi.error('音频截取失败');
      }
    }, [selectedSegment, isValidSegment, processAudio, outputFormat, bitRate, onSubmit, messageApi]);

    // 使用useImperativeHandle暴露方法给父组件
    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      submitCrop: handleSubmitCrop
    }), [handleSubmit, handleSubmitCrop]);
  
    // 初始化推荐预设 - 只在第一次时执行
    useEffect(() => {
      if (!presetInitializedRef.current) {
        handlePresetChange('recommended');
        presetInitializedRef.current = true;
      }
    }, [handlePresetChange]);
  
    const onPresetChange = useCallback((preset: string) => {
      setSelectedPreset(preset);
      handlePresetChange(preset);
    }, [setSelectedPreset, handlePresetChange]);
  
    return (
      <>
        {contextHolder}
        {/* 波形显示区域 */}
        <AudioWaveform
          audioUrl={audioUrl}
          onAudioCrop={handleAudioCrop}
          initAudioProcessing={wrappedInitAudioProcessing}
          onAudioGenerated={onAudioGenerated}
          onClearAudio={onClearAudio}
          audioPlayerHook={audioPlayerHook}
          processAudio={processAudio}
          outputFormat={outputFormat}
          bitRate={bitRate}
          onRecordingStateChange={onRecordingStateChange}
        />
  
        {/* 设置面板区域 */}
        <AudioSettings 
          processingHook={audioProcessingHook}
          selectedPreset={selectedPreset}
          onPresetChange={onPresetChange}
          disabled={!audioUrl}
        />
      </>
    );
  });