import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AudioWaveformProps, AudioSegment } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export interface AudioWaveformRef {
  getAudioRef: () => React.RefObject<HTMLAudioElement>;
  getWaveformRef: () => React.RefObject<HTMLDivElement>;
  getOverviewRef: () => React.RefObject<HTMLDivElement>;
  getPeaksInstance: () => any;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  playSegment: (segment: AudioSegment) => void;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(
  ({ audioUrl, height = 120, onSegmentSelect, onTimeUpdate, className, style }, ref) => {
    const waveformContainerRef = useRef<HTMLDivElement>(null);
    const overviewContainerRef = useRef<HTMLDivElement>(null);
    const audioElementRef = useRef<HTMLAudioElement>(null);

    const {
      playerState,
      play,
      pause,
      seek,
      playSegment,
      getAudioRef,
      getWaveformRef,
      getOverviewRef,
      getPeaksInstance
    } = useAudioPlayer(audioUrl) as any;

    // 监听片段选择变化
    useEffect(() => {
      if (onSegmentSelect && playerState.selectedSegment) {
        onSegmentSelect(playerState.selectedSegment);
      }
    }, [playerState.selectedSegment, onSegmentSelect]);

    // 监听时间更新
    useEffect(() => {
      if (onTimeUpdate) {
        onTimeUpdate(playerState.currentTime);
      }
    }, [playerState.currentTime, onTimeUpdate]);

    // 设置DOM引用
    useEffect(() => {
      const audioRef = getAudioRef();
      const waveformRef = getWaveformRef();
      const overviewRef = getOverviewRef();

      if (audioElementRef.current && audioRef) {
        audioRef.current = audioElementRef.current;
      }
      if (waveformContainerRef.current && waveformRef) {
        waveformRef.current = waveformContainerRef.current;
      }
      if (overviewContainerRef.current && overviewRef) {
        overviewRef.current = overviewContainerRef.current;
      }
    }, [getAudioRef, getWaveformRef, getOverviewRef]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getAudioRef,
      getWaveformRef,
      getOverviewRef,
      getPeaksInstance,
      play,
      pause,
      seek,
      playSegment
    }), [getAudioRef, getWaveformRef, getOverviewRef, getPeaksInstance, play, pause, seek, playSegment]);

    const formatTime = (seconds: number): string => {
      if (!isFinite(seconds)) return '00:00';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className={className} style={style}>
        {/* 隐藏的音频元素 */}
        <audio
          ref={audioElementRef}
          src={audioUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
        
        {/* 播放控制栏 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '10px',
          padding: '10px',
          background: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <button
            onClick={play}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: playerState.isPlaying ? '#dc3545' : '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {playerState.isPlaying ? '暂停' : '播放'}
          </button>
          
          {playerState.selectedSegment && (
            <button
              onClick={() => playSegment(playerState.selectedSegment!)}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#28a745',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              播放选中区间
            </button>
          )}
          
          <span style={{ color: '#666' }}>
            {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
          </span>
          
          {playerState.selectedSegment && (
            <span style={{ marginLeft: '20px', color: '#007bff' }}>
              选中区间: {formatTime(playerState.selectedSegment.startTime)} - {formatTime(playerState.selectedSegment.endTime)}
            </span>
          )}
        </div>

        {/* 波形显示区域 */}
        <div
          ref={waveformContainerRef}
          style={{
            height: `${height}px`,
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />

        {/* 概览区域 */}
        <div
          ref={overviewContainerRef}
          style={{
            height: '60px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
    );
  }
);

AudioWaveform.displayName = 'AudioWaveform'; 