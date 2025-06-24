import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioPlayerState, AudioSegment } from '../types';

export interface UseAudioPlayerOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onSegmentChange?: (segment: AudioSegment | null) => void;
}

export const useAudioPlayer = (options: UseAudioPlayerOptions = {}) => {
  const { onError, onSuccess, onTimeUpdate, onSegmentChange } = options;
  
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isLoading: false,
    error: null,
  });
  
  const [selectedSegment, setSelectedSegment] = useState<AudioSegment | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  const updatePlayerState = useCallback((updates: Partial<AudioPlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadAudio = useCallback((audioUrl: string) => {
    if (!audioUrl) {
      updatePlayerState({ error: '无效的音频URL' });
      return;
    }

    updatePlayerState({ isLoading: true, error: null });

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      updatePlayerState({
        duration: audio.duration,
        isLoading: false,
      });
      onSuccess?.('音频加载成功');
    });

    audio.addEventListener('error', (_e) => {
      const errorMsg = '音频加载失败';
      updatePlayerState({ 
        error: errorMsg,
        isLoading: false 
      });
      onError?.(errorMsg);
    });

    audio.addEventListener('timeupdate', () => {
      const currentTime = audio.currentTime;
      updatePlayerState({ currentTime });
      onTimeUpdate?.(currentTime);
    });

    audio.addEventListener('ended', () => {
      updatePlayerState({ isPlaying: false });
    });

    audio.load();
  }, [updatePlayerState, onError, onSuccess, onTimeUpdate]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (playerState.isPlaying) {
        audioRef.current.pause();
        updatePlayerState({ isPlaying: false });
      } else {
        await audioRef.current.play();
        updatePlayerState({ isPlaying: true });
      }
    } catch (error) {
      const errorMsg = '播放控制失败';
      onError?.(errorMsg);
      updatePlayerState({ error: errorMsg });
    }
  }, [playerState.isPlaying, updatePlayerState, onError]);

  const setCurrentTime = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = Math.max(0, Math.min(time, playerState.duration));
    updatePlayerState({ currentTime: audioRef.current.currentTime });
  }, [playerState.duration, updatePlayerState]);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    updatePlayerState({ volume: clampedVolume });
  }, [updatePlayerState]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return;
    
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    audioRef.current.playbackRate = clampedRate;
    updatePlayerState({ playbackRate: clampedRate });
  }, [updatePlayerState]);

  const setSegment = useCallback((segment: AudioSegment | null) => {
    setSelectedSegment(segment);
    onSegmentChange?.(segment);
  }, [onSegmentChange]);

  const playSegment = useCallback(async () => {
    if (!audioRef.current || !selectedSegment) return;

    try {
      audioRef.current.currentTime = selectedSegment.startTime;
      await audioRef.current.play();
      updatePlayerState({ isPlaying: true });

      const segmentDuration = (selectedSegment.endTime - selectedSegment.startTime) * 1000;
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          updatePlayerState({ isPlaying: false });
        }
      }, segmentDuration);
    } catch (error) {
      const errorMsg = '片段播放失败';
      onError?.(errorMsg);
      updatePlayerState({ error: errorMsg });
    }
  }, [selectedSegment, updatePlayerState, onError]);

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
    updatePlayerState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  }, [updatePlayerState]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...playerState,
    selectedSegment,
    loadAudio,
    togglePlay,
    setCurrentTime,
    setVolume,
    setPlaybackRate,
    setSegment,
    playSegment,
    formatTime,
    cleanup,
    audioRef,
  };
}; 