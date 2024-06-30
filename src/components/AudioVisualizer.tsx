import React, { useState } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isRecording: boolean;
  isLoading: boolean;
  topic: string;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, isRecording, isLoading, topic, audioRef }) => {
  const [flashLeft, setFlashLeft] = useState(false);
  const [flashRight, setFlashRight] = useState(false);

  const handleCircleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const circle = event.currentTarget;
    const rect = circle.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    if (audioRef.current) {
      if (x < rect.width / 2) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
        setFlashLeft(true);
        setTimeout(() => setFlashLeft(false), 200);
      } else {
        audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
        setFlashRight(true);
        setTimeout(() => setFlashRight(false), 200);
      }
    }
  };

  return (
    <div 
      className={`w-64 h-64 rounded-full flex items-center justify-center cursor-pointer relative ${
        isLoading ? 'animate-pulse bg-gradient-to-br from-[#9ed6df] to-[#C4E0E5]' :
        isPlaying ? 'animate-pulse bg-gradient-to-br from-[#4CA1AF] to-[#C4E0E5]' : 
        isRecording ? 'bg-red-500' : 'bg-[#cfe0e4]'
      }`}
      onClick={handleCircleClick}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      ) : (
        <span className="text-white text-2xl font-bold">{topic}</span>
      )}
      {flashLeft && (
        <div className="absolute left-0 top-0 w-1/2 h-full bg-white opacity-50 rounded-l-full transition-opacity duration-300"></div>
      )}
      {flashRight && (
        <div className="absolute right-0 top-0 w-1/2 h-full bg-white opacity-50 rounded-r-full transition-opacity duration-300"></div>
      )}
    </div>
  );
};

export default AudioVisualizer;