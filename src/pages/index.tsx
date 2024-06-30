import React, { useState } from 'react';
import PodcastPlayer from '@/components/PodcastPlayer';
import { motion } from 'framer-motion';

export default function Home() {
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [isPodcastActive, setIsPodcastActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPodcast = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPodcastActive(true);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#C4E0E5] p-4">
      {!isPodcastActive ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#7db6bf] bg-opacity-40 p-8 rounded-lg shadow-xl space-y-6 w-full max-w-md"
        >
          <h1 className="text-3xl font-bold text-center text-white mb-6">Create Your Podcast</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold text-white mb-1">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                placeholder="e.g., 15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="text-gray-600 w-full p-3 border bg-[#C4E0E5] border-gray-300 focus:outline-none rounded-md x focus:ring-[#4CA1AF] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-white mb-1">Podcast Topic</label>
              <input
                id="topic"
                type="text"
                placeholder="e.g., Bezier Curves"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-gray-600 w-full p-3 border border-gray-300 bg-[#C4E0E5] rounded-md focus:outline-none  focus:ring-[#4CA1AF] focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startPodcast}
              disabled={isLoading || !duration || !topic}
              className={`w-full bg-gradient-to-r from-[#4CA1AF] to-[#C4E0E5] text-white p-3 rounded-md font-semibold 
                ${(isLoading || !duration || !topic) ? 'opacity-50 cursor-not-allowed' : 'animate-pulse hover:from-[#4CA1AF] hover:to-[#C4E0E5]'}`}
            >
              {isLoading ? 'Generating...' : 'Start Podcast'}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <PodcastPlayer topic={topic} duration={parseInt(duration)} />
      )}
      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 mt-4 text-center bg-red-100 p-3 rounded-md"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}