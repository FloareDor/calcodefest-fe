import React, { useState, useEffect } from 'react';

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
  const [raindrops, setRaindrops] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateRaindrops = () => {
      return Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="raindrop"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ));
    };
    setRaindrops(generateRaindrops());
  }, []);

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
    <div className="relative w-80 h-80">
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {raindrops}
      </div>
      <div
        className={`absolute inset-2 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-sm ${
          isLoading ? 'animate-pulse bg-gradient-to-br from-[#9ed6df] to-[#C4E0E5] bg-opacity-50' :
          isPlaying ? 'animate-pulse bg-gradient-to-br from-[#9ed6df] to-[#C4E0E5] bg-opacity-50' :
          isRecording ? 'bg-red-400 bg-opacity-50' : 'bg-[#cbe8ee] bg-opacity-50'
        }`}
        onClick={handleCircleClick}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        ) : (
          <span className="text-white text-2xl font-bold text-center">{topic}</span>
        )}
        {flashLeft && (
          <div className="absolute left-0 top-0 w-1/2 h-full text-gray-700 bg-white opacity-50 rounded-l-full transition-opacity duration-300 flex items-center justify-center">
            <span className="text-xl font-bold">&lt;&lt; 5 seconds</span>
          </div>
        )}
        {flashRight && (
          <div className="absolute right-0 top-0 w-1/2 h-full bg-white opacity-50 rounded-r-full transition-opacity duration-300 flex items-center justify-center">
            <span className="text-xl font-bold">5 seconds &gt;&gt;</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioVisualizer;