// pages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const [isPodcastActive, setIsPodcastActive] = useState(false);
  const audioRef = useRef<MediaRecorder | null>(null);

  const startPodcast = async () => {
    try {
      await axios.post('/api/start-podcast', { duration, topic });
      setIsPodcastActive(true);
      fetchConversation();
    } catch (error) {
      console.error('Failed to start podcast:', error);
    }
  };

  const fetchConversation = async () => {
    while (isPodcastActive) {
      try {
        const hostResponse = await axios.get('/api/host');
        setConversation(prev => [...prev, `Host: ${hostResponse.data}`]);
        
        const expertResponse = await axios.get('/api/expert');
        setConversation(prev => [...prev, `Expert: ${expertResponse.data}`]);

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between fetches
      } catch (error) {
        console.error('Failed to fetch conversation:', error);
      }
    }
  };

  const handleRecordStart = () => {
    setIsRecording(true);
    // Start recording logic here
  };

  const handleRecordStop = async () => {
    setIsRecording(false);
    // Stop recording and send audio to backend
    try {
      const audioBlob = await stopRecording();
      const formData = new FormData();
      formData.append('audio', audioBlob);
      await axios.post('/api/listener', formData);
      // Remove last host/expert response
      setConversation(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('Failed to send listener audio:', error);
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current.ondataavailable = (event) => {
          resolve(event.data);
        };
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {!isPodcastActive ? (
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Podcast Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={startPodcast}
            className="bg-black text-white p-2 rounded"
          >
            Start Podcast
          </button>
        </div>
      ) : (
        <div className="space-y-4 w-full max-w-md">
          <div
            className={`w-32 h-32 rounded-full bg-black mx-auto ${
              isRecording ? 'animate-pulse' : 'animate-spin'
            }`}
            onMouseDown={handleRecordStart}
            onMouseUp={handleRecordStop}
            onTouchStart={handleRecordStart}
            onTouchEnd={handleRecordStop}
          ></div>
          <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <p key={index} className="mb-2">
                {message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}