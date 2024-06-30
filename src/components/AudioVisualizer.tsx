import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { IoPlaySharp, IoPauseSharp } from 'react-icons/io5';
import { BiSkipPrevious, BiSkipNext } from 'react-icons/bi';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isRecording: boolean;
  isLoading: boolean;
  topic: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isRecording,
  isLoading,
  topic,
  audioRef,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onRecordStart,
  onRecordStop
}) => {
  const [raindrops, setRaindrops] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateRaindrops = () => {
      return Array.from({ length: 200 }, (_, i) => (
        <div
          key={i}
          className="raindrop"
          style={{
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animationDuration: `${0.5 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ));
    };
    setRaindrops(generateRaindrops());
  }, []);

  return (
    <div className="relative w-80 h-80">
      <div className="fixed inset-0 pointer-events-none">
        {raindrops}
      </div>
      <div
        className={`absolute inset-2 rounded-full flex flex-col items-center justify-center backdrop-blur-md ${
          isLoading ? 'animate-pulse bg-gradient-to-br from-[#9ed6df] to-[#C4E0E5] bg-opacity-50' :
          isPlaying ? 'animate-pulse bg-gradient-to-br from-[#9ed6df] to-[#C4E0E5] bg-opacity-50' :
          isRecording ? 'bg-gradient-to-br from-[#ff9999] to-[#ffb3b3] bg-opacity-50' : 'bg-[#cbe8ee] bg-opacity-50'
        }`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        ) : (
          <>
            <button
              onClick={isRecording ? onRecordStop : onRecordStart}
              className={`mb-4 p-3 rounded-full transition-all duration-300 ${
                isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-[#a5dbe6] hover:bg-[#c1e5eb]'
              }`}
            >
              {isRecording ? <FaStop size={20} color="white" /> : <FaMicrophone size={20} color="white" />}
            </button>
           
            <span className="text-white text-2xl font-bold text-center mb-4">{topic}</span>
           
            <div className="flex justify-center space-x-4">
              <button
                onClick={onSkipBack}
                className="p-3 bg-[#a5dbe6] hover:bg-[#c1e5eb] rounded-full transition-all duration-300"
              >
                <BiSkipPrevious size={24} color="white" />
              </button>
              <button
                onClick={onPlayPause}
                className="p-3 bg-[#a5dbe6] hover:bg-[#c1e5eb] rounded-full transition-all duration-300"
              >
                {isPlaying ? <IoPauseSharp size={24} color="white" /> : <IoPlaySharp size={24} color="white" />}
              </button>
              <button
                onClick={onSkipForward}
                className="p-3 bg-[#a5dbe6] hover:bg-[#c1e5eb] rounded-full transition-all duration-300"
              >
                <BiSkipNext size={24} color="white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioVisualizer;