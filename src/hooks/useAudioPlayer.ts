import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioPlayerState, AudioPlayerResult, AudioSegment } from '../types';
// @ts-ignore
import Peaks from 'peaks.js';

export const useAudioPlayer = (audioUrl: string): AudioPlayerResult => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    selectedSegment: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  
  // Peaks.js 实例引用
  const peaksRef = useRef<any>(null);
  
  const segmentPlaybackControlRef = useRef<{
    animationId?: number;
    timeoutId?: NodeJS.Timeout;
    endTime?: number;
  }>({});

  const clearSegmentPlaybackControl = useCallback(() => {
    if (segmentPlaybackControlRef.current.animationId) {
      cancelAnimationFrame(segmentPlaybackControlRef.current.animationId);
      segmentPlaybackControlRef.current.animationId = undefined;
    }
    if (segmentPlaybackControlRef.current.timeoutId) {
      clearTimeout(segmentPlaybackControlRef.current.timeoutId);
      segmentPlaybackControlRef.current.timeoutId = undefined;
    }
    segmentPlaybackControlRef.current.endTime = undefined;
  }, []);

  const isValidSegment = useCallback((segment: AudioSegment | null): boolean => {
    if (segment === null || !audioRef.current) return false;
    
    return !isNaN(segment.startTime) && 
           !isNaN(segment.endTime) && 
           segment.startTime >= 0 && 
           segment.endTime > segment.startTime &&
           segment.endTime <= audioRef.current.duration;
  }, []);

  const addDefaultSegment = useCallback(() => {
    if (peaksRef.current && audioRef.current && !isNaN(audioRef.current.duration)) {
      const duration = audioRef.current.duration;
      if (duration > 0 && !isNaN(duration)) {
        const segment: AudioSegment = {
          startTime: 0,
          endTime: Math.min(2, duration),
          editable: true,
          color: '#ff9800',
          labelText: '选择区间',
          id: 'default-segment'
        };
        
        peaksRef.current.segments.add(segment);
        setPlayerState(prev => ({ ...prev, selectedSegment: segment }));
      }
    }
  }, []);

  const checkPlaybackPosition = useCallback(() => {
    if (!audioRef.current || !segmentPlaybackControlRef.current.endTime) {
      return;
    }

    const currentTime = audioRef.current.currentTime;
    const endTime = segmentPlaybackControlRef.current.endTime;
    
    if (currentTime >= endTime - 0.01) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      clearSegmentPlaybackControl();
      return;
    }

    segmentPlaybackControlRef.current.animationId = requestAnimationFrame(checkPlaybackPosition);
  }, [clearSegmentPlaybackControl]);

  // 播放/暂停
  const play = useCallback(() => {
    if (!audioRef.current) return;

    if (playerState.isPlaying) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      clearSegmentPlaybackControl();
    } else {
      clearSegmentPlaybackControl();
      
      audioRef.current.play().then(() => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }).catch(error => {
        console.error('音频播放失败:', error);
      });
    }
  }, [playerState.isPlaying, clearSegmentPlaybackControl]);

  // 暂停
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      clearSegmentPlaybackControl();
    }
  }, [clearSegmentPlaybackControl]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && !isNaN(time) && time >= 0 && time <= audioRef.current.duration) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioRef.current.volume = clampedVolume;
      setPlayerState(prev => ({ ...prev, volume: clampedVolume }));
    }
  }, []);

  const selectSegment = useCallback((segment: AudioSegment | null) => {
    setPlayerState(prev => ({ ...prev, selectedSegment: segment }));
  }, []);

  const playSegment = useCallback((segment: AudioSegment) => {
    if (!audioRef.current || !isValidSegment(segment)) {
      return;
    }

    if (playerState.isPlaying) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      clearSegmentPlaybackControl();
      return;
    }

    clearSegmentPlaybackControl();

    audioRef.current.currentTime = segment.startTime;
    
    segmentPlaybackControlRef.current.endTime = segment.endTime;
    
    const duration = segment.endTime - segment.startTime;
    segmentPlaybackControlRef.current.timeoutId = setTimeout(() => {
      if (audioRef.current && playerState.isPlaying) {
        audioRef.current.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        clearSegmentPlaybackControl();
      }
    }, duration * 1000 + 50); // 增加50毫秒缓冲

    audioRef.current.play().then(() => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      segmentPlaybackControlRef.current.animationId = requestAnimationFrame(checkPlaybackPosition);
    }).catch(error => {
      console.error('音频播放失败:', error);
      clearSegmentPlaybackControl();
    });
  }, [playerState.isPlaying, isValidSegment, clearSegmentPlaybackControl, checkPlaybackPosition]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime: audioRef.current?.currentTime || 0 
      }));
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: audioRef.current?.duration || 0 
      }));
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    clearSegmentPlaybackControl();
  }, [clearSegmentPlaybackControl]);

  useEffect(() => {
    if (audioUrl && waveformRef.current && audioRef.current) {
      if (peaksRef.current) {
        try {
          peaksRef.current.destroy();
        } catch (error) {
          console.warn('销毁Peaks实例时出错:', error);
        }
        peaksRef.current = null;
      }

      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        selectedSegment: null
      }));

      const options = {
        container: waveformRef.current,
        mediaElement: audioRef.current,
        webAudio: {
          audioContext: new (window.AudioContext || (window as any).webkitAudioContext)()
        },
        zoomLevels: [512, 1024, 2048, 4096],
        height: 120,
        waveformColor: '#428bca',
        playheadColor: '#d62728',
        playheadTextColor: '#aaa'
      };

      if (overviewRef.current) {
        (options as any).overview = {
          container: overviewRef.current,
          height: 60
        };
      }

      // @ts-ignore
      Peaks.init(options, (err: any, peaks: any) => {
        if (err) {
          console.error('Failed to initialize Peaks.js:', err);
          return;
        }
        
        peaksRef.current = peaks;
        
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          addDefaultSegment();
        } else {
          const handleLoadedMetadata = () => {
            addDefaultSegment();
            audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          audioRef.current?.addEventListener('loadedmetadata', handleLoadedMetadata);
        }
        
        peaks.on('segments.click', (segment: any) => {
          if (isValidSegment(segment)) {
            setPlayerState(prev => ({ ...prev, selectedSegment: segment }));
          }
        });

        // 监听拖拽事件
        peaks.on('segments.dragged', (event: any) => {
          if (!audioRef.current || isNaN(audioRef.current.duration)) {
            return;
          }

          const audioDuration = audioRef.current.duration;
          let constrainedStartTime = event.segment.startTime;
          let constrainedEndTime = event.segment.endTime;
          let needsUpdate = false;
          
          if (constrainedStartTime < 0) {
            constrainedStartTime = 0;
            needsUpdate = true;
          }
          
          if (constrainedEndTime > audioDuration) {
            constrainedEndTime = audioDuration;
            needsUpdate = true;
          }
          
          if (constrainedEndTime <= constrainedStartTime) {
            constrainedEndTime = Math.min(constrainedStartTime + 0.1, audioDuration);
            needsUpdate = true;
          }

          if (needsUpdate) {
            try {
              event.segment.update({
                startTime: constrainedStartTime,
                endTime: constrainedEndTime
              });
            } catch (error) {
              console.warn('拖拽过程中更新segment位置时出错:', error);
            }
          }
        });

        peaks.on('segments.dragend', (event: any) => {
          if (!audioRef.current || isNaN(audioRef.current.duration)) {
            return;
          }

          const audioDuration = audioRef.current.duration;
          let updatedSegment = {
            ...event.segment,
            startTime: event.segment.startTime,
            endTime: event.segment.endTime
          };

          // 自动修正超出范围的时间
          let needsUpdate = false;
          
          if (updatedSegment.startTime < 0) {
            updatedSegment.startTime = 0;
            needsUpdate = true;
          }
          
          if (updatedSegment.endTime > audioDuration) {
            updatedSegment.endTime = audioDuration;
            needsUpdate = true;
          }
          
          if (updatedSegment.endTime <= updatedSegment.startTime) {
            updatedSegment.endTime = Math.min(updatedSegment.startTime + 0.1, audioDuration);
            needsUpdate = true;
          }

          if (needsUpdate) {
            try {
              event.segment.update({
                startTime: updatedSegment.startTime,
                endTime: updatedSegment.endTime
              });
            } catch (error) {
              console.warn('更新segment位置时出错:', error);
            }
          }

          if (isValidSegment(updatedSegment)) {
            setPlayerState(prev => ({ ...prev, selectedSegment: updatedSegment }));
          }
        });

        peaks.on('zoomview.click', (event: any) => {
          if (event.time && !isNaN(event.time) && audioRef.current && !isNaN(audioRef.current.duration)) {
            seek(event.time);
          }
        });
      });
    }

    return () => {
      if (peaksRef.current) {
        try {
          peaksRef.current.destroy();
        } catch (error) {
          console.warn('清理Peaks实例时出错:', error);
        }
        peaksRef.current = null;
      }
      clearSegmentPlaybackControl();
    };
  }, [audioUrl, addDefaultSegment, clearSegmentPlaybackControl, isValidSegment, seek]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('ended', handleEnded);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  const getAudioRef = useCallback(() => audioRef, []);
  const getWaveformRef = useCallback(() => waveformRef, []);
  const getOverviewRef = useCallback(() => overviewRef, []);
  const getPeaksInstance = useCallback(() => peaksRef.current, []);

  return {
    playerState,
    play,
    pause,
    seek,
    setVolume,
    selectSegment,
    playSegment,
    getAudioRef,
    getWaveformRef,
    getOverviewRef,
    getPeaksInstance,
    isValidSegment
  } as AudioPlayerResult & {
    getAudioRef: () => React.RefObject<HTMLAudioElement>;
    getWaveformRef: () => React.RefObject<HTMLDivElement>;
    getOverviewRef: () => React.RefObject<HTMLDivElement>;
    getPeaksInstance: () => any;
    isValidSegment: (segment: AudioSegment | null) => boolean;
  };
}; 