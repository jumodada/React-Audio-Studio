import React, { useCallback, useEffect } from 'react';
import { AudioRecorderProps } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingStateChange,
  className,
  style
}) => {
  const {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  } = useAudioRecorder();

  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(recordingState);
    }
  }, [recordingState, onRecordingStateChange]);

  useEffect(() => {
    if (onRecordingComplete && recordingState.audioUrl && recordingState.audioBlob && !recordingState.isRecording) {
      onRecordingComplete(recordingState.audioUrl, recordingState.audioBlob);
    }
  }, [recordingState.audioUrl, recordingState.audioBlob, recordingState.isRecording, onRecordingComplete]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('开始录音失败:', error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  }, [stopRecording]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={className} style={style}>
      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: recordingState.isRecording 
              ? (recordingState.isPaused ? '#ffa500' : '#dc3545')
              : '#666'
          }}>
            {formatTime(recordingState.duration)}
          </div>
          
          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            {recordingState.isRecording
              ? (recordingState.isPaused ? '录音已暂停' : '正在录音...')
              : recordingState.audioUrl
                ? '录音完成'
                : '准备录音'
            }
          </div>
        </div>

        {recordingState.isRecording && !recordingState.isPaused && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              animation: 'pulse 1s infinite'
            }} />
            <style>
              {`
                @keyframes pulse {
                  0% { opacity: 1; }
                  50% { opacity: 0.5; }
                  100% { opacity: 1; }
                }
              `}
            </style>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {!recordingState.isRecording ? (
            <>
              <button
                onClick={handleStartRecording}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🎤 开始录音
              </button>
              
              {recordingState.audioUrl && (
                <button
                  onClick={clearRecording}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #6c757d',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#6c757d',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  清除录音
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleStopRecording}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⏹️ 停止录音
              </button>
              
              {recordingState.isPaused ? (
                <button
                  onClick={resumeRecording}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ▶️ 继续录音
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ffc107',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ⏸️ 暂停录音
                </button>
              )}
            </>
          )}
        </div>

        {/* 录音结果播放 */}
        {recordingState.audioUrl && !recordingState.isRecording && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              marginBottom: '10px',
              fontSize: '14px',
              color: '#666'
            }}>
              录音结果预览:
            </div>
            
            <audio
              controls
              src={recordingState.audioUrl}
              style={{
                width: '100%'
              }}
            />
          </div>
        )}

        {!recordingState.isRecording && !recordingState.audioUrl && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '6px',
            border: '1px solid #b3d9ff',
            fontSize: '14px',
            color: '#0056b3'
          }}>
            💡 提示：点击"开始录音"按钮开始录制音频，录音过程中可以暂停和继续。
          </div>
        )}
      </div>
    </div>
  );
}; 