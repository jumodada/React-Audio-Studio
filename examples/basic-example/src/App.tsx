import React, { useState, useRef } from 'react';
import {
  useAudioRecording,
  useAudioPlayer,
  useAudioProcessing,
  useDeviceAudioCapabilities
} from '@react-audio-studio/core';
import './App.css';

const App: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 使用录音功能
  const recording = useAudioRecording({
    onError: (error) => addLog(`❌ ${error}`),
    onSuccess: (msg) => addLog(`✅ ${msg}`),
  });

  // 使用播放器功能
  const player = useAudioPlayer({
    onError: (error) => addLog(`❌ ${error}`),
    onSuccess: (msg) => addLog(`✅ ${msg}`),
  });

  // 使用音频处理功能
  const processor = useAudioProcessing({
    onError: (error) => addLog(`❌ ${error}`),
    onSuccess: (msg) => addLog(`✅ ${msg}`),
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
      addLog(`📁 已加载文件: ${file.name}`);
    }
  };

  // 开始录音
  const handleStartRecording = () => {
    recording.startRecording(() => {
      setAudioUrl('');
      player.cleanup();
      addLog('🎙️ 开始录音...');
    });
  };

  // 停止录音
  const handleStopRecording = () => {
    recording.stopRecording((url) => {
      setAudioUrl(url);
      player.loadAudio(url);
      addLog('🎵 录音完成');
    });
  };

  // 处理音频
  const handleProcessAudio = async () => {
    if (!audioUrl) {
      addLog('⚠️ 请先录制或上传音频文件');
      return;
    }

    try {
      addLog('🔄 开始处理音频...');
      const processedBlob = await processor.processAudio(audioUrl);
      const processedUrl = URL.createObjectURL(processedBlob);
      setAudioUrl(processedUrl);
      player.loadAudio(processedUrl);
      addLog('✨ 音频处理完成');
    } catch (error) {
      addLog('❌ 音频处理失败');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 React Audio Studio - 基础示例</h1>
        <p>一个现代化的React音频录制和处理组件库</p>
      </header>

      <div className="app-content">
        {/* 设备信息 */}
        <div className="section">
          <h2>📱 设备信息</h2>
          <div className="device-info">
            <div>最大采样率: {deviceCapabilities.formatSampleRate(deviceCapabilities.maxSampleRate)}</div>
            <div>支持格式: {deviceCapabilities.supportedFormats.join(', ')}</div>
            <div>音频上下文: {deviceCapabilities.deviceInfo.audioContext ? '✅' : '❌'}</div>
            <div>录音器: {deviceCapabilities.deviceInfo.mediaRecorder ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* 录音控制 */}
        <div className="section">
          <h2>🎙️ 录音控制</h2>
          <div className="recording-section">
            <div 
              ref={recording.recordingWaveRef} 
              className="waveform-container"
              style={{ height: '60px', background: '#f0f0f0', border: '1px solid #ddd' }}
            />
            <div className="recording-info">
              录音时长: {recording.formatRecordingTime(recording.recordingDuration)}
            </div>
            <div className="recording-controls">
              <button
                onClick={handleStartRecording}
                disabled={recording.isRecording}
                className={recording.isGettingPermission ? 'loading' : ''}
              >
                {recording.isGettingPermission ? '获取权限中...' : '🎙️ 开始录音'}
              </button>
              <button
                onClick={handleStopRecording}
                disabled={!recording.isRecording}
              >
                ⏹️ 停止录音
              </button>
            </div>
          </div>
        </div>

        {/* 文件上传 */}
        <div className="section">
          <h2>📁 文件上传</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="upload-btn"
          >
            📂 选择音频文件
          </button>
          {audioUrl && <div className="file-status">✅ 音频文件已加载</div>}
        </div>

        {/* 音频播放器 */}
        <div className="section">
          <h2>🎵 音频播放器</h2>
          <div className="player-section">
            <div className="time-display">
              <span>{player.formatTime(player.currentTime)}</span>
              <span>{player.formatTime(player.duration)}</span>
            </div>
            
            <input
              type="range"
              min={0}
              max={player.duration || 1}
              step={0.1}
              value={player.currentTime}
              onChange={(e) => player.setCurrentTime(Number(e.target.value))}
              disabled={!audioUrl}
              className="progress-slider"
            />
            
            <div className="player-controls">
              <button
                onClick={player.togglePlay}
                disabled={!audioUrl || player.isLoading}
                className="play-btn"
              >
                {player.isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
              </button>
            </div>

            <div className="audio-controls">
              <div className="control-group">
                <label>音量: {Math.round(player.volume * 100)}%</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={player.volume}
                  onChange={(e) => player.setVolume(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label>播放速度: {player.playbackRate}x</label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={player.playbackRate}
                  onChange={(e) => player.setPlaybackRate(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 音频处理 */}
        <div className="section">
          <h2>🔧 音频处理</h2>
          <div className="processing-section">
            <div className="presets">
              <label>预设:</label>
              <select onChange={(e) => processor.applyPreset(e.target.value)}>
                <option value="">选择预设</option>
                {processor.presetOptions.map(preset => (
                  <option key={preset} value={preset}>
                    {preset === 'standard' ? '标准' : 
                     preset === 'recommended' ? '推荐' : '最高质量'}
                  </option>
                ))}
              </select>
            </div>

            <div className="format-controls">
              <div className="control-group">
                <label>输出格式:</label>
                <select
                  value={processor.params.outputFormat}
                  onChange={(e) => processor.updateParams({ outputFormat: e.target.value as any })}
                >
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                  <option value="opus">OPUS</option>
                </select>
              </div>
              <div className="control-group">
                <label>采样率:</label>
                <select
                  value={processor.params.sampleRate}
                  onChange={(e) => processor.updateParams({ sampleRate: e.target.value as any })}
                >
                  <option value="44.1kHz">44.1kHz</option>
                  <option value="48kHz">48kHz</option>
                  <option value="96kHz">96kHz</option>
                </select>
              </div>
            </div>

            <div className="effect-controls">
              <div className="control-group">
                <label>音量增益: {processor.params.volumeGain}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={processor.params.volumeGain}
                  onChange={(e) => processor.updateParams({ volumeGain: Number(e.target.value) })}
                />
              </div>
              <div className="control-group">
                <label>清晰度: {processor.params.clarity}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={processor.params.clarity}
                  onChange={(e) => processor.updateParams({ clarity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="processing-controls">
              <button onClick={processor.resetParams}>
                🔄 重置参数
              </button>
              <button
                onClick={handleProcessAudio}
                disabled={!audioUrl}
                className="process-btn"
              >
                ✨ 处理音频
              </button>
            </div>
          </div>
        </div>

        {/* 日志 */}
        <div className="section">
          <h2>📋 操作日志</h2>
          <div className="logs">
            {logs.map((log, index) => (
              <div key={index} className="log-item">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 