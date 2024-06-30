import React, { useState } from 'react';
import PodcastPlayer from '@/components/PodcastPlayer';

export default function Home() {
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [isPodcastActive, setIsPodcastActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPodcast = async () => {
    setIsLoading(true);
    setError(null);
    setIsPodcastActive(true);
    setIsLoading(false);
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
            disabled={isLoading}
            className="bg-black text-white p-2 rounded"
          >
            {isLoading ? 'Generating...' : 'Start Podcast'}
          </button>
        </div>
      ) : (
        <PodcastPlayer topic={topic} duration={parseInt(duration)} />
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}