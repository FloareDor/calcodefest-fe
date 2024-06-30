import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from './AudioVisualizer';
import { usePodcastLogic } from './podcastLogic';

interface PodcastPlayerProps {
  topic: string;
  duration: number;
}

const TranscriptLine: React.FC<{ message: string; index: number }> = ({ message, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="bg-blue-100 bg-opacity-75 rounded-lg p-2 mb-2"
  >
    {message}
  </motion.div>
);

export default function PodcastPlayer({ topic, duration }: PodcastPlayerProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const {
    visibleConversation,
    isRecording,
    isPlaying,
    error,
    isLoading,
    isThundering,
    audioRef,
    backgroundAudioRef,
    thunderAudioRef,
    handleAudioEnd,
    handlePlayPause,
    handleSkipBack,
    handleSkipForward,
    handleRecordStart,
    handleRecordStop,
  } = usePodcastLogic(topic, duration);

  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-8 relative overflow-hidden">
      {isThundering && (
        <div className="absolute inset-0 bg-white opacity-75 z-10 animate-flash"></div>
      )}
      <div className="w-full max-w-md bg-[#aed8df] bg-opacity-20 backdrop-blur-xl rounded-3xl shadow-lg p-8 relative z-20">
        <AudioVisualizer 
          isPlaying={isPlaying}
          isRecording={isRecording}
          isLoading={isLoading}
          topic={topic}
          audioRef={audioRef}
          onPlayPause={handlePlayPause}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onRecordStart={handleRecordStart}
          onRecordStop={handleRecordStop}
        />
    
        <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        <audio ref={backgroundAudioRef} className="hidden" />
        <audio ref={thunderAudioRef} src="/thunderstorm.mp3" className="hidden" />
    
        {error && <p className="text-white mt-4 text-center bg-red-500 bg-opacity-50 p-2 rounded">{error}</p>}

        <button
          onClick={toggleTranscript}
          className="mt-4 p-2 bg-[#a5dbe6] hover:bg-[#c1e5eb] text-white rounded-full hover:scale-105 duration-300 shadow-lg"
          aria-label="Toggle transcript"
        >
          💬 {showTranscript ? 'Hide' : 'Show'} Transcript
        </button>

        {showTranscript && (
          <div className="mt-6 w-full max-h-60 overflow-y-auto p-4 bg-white bg-opacity-50 backdrop-blur-sm rounded-lg">
            <AnimatePresence>
              {visibleConversation.map((message, index) => (
                <TranscriptLine key={index} message={message} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}