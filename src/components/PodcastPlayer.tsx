import React, { useState, useEffect, useRef } from 'react';

interface PodcastPlayerProps {
  topic: string;
  duration: number;
}

export default function PodcastPlayer({ topic, duration }: PodcastPlayerProps) {
  const [conversation, setConversation] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioQueue = useRef<string[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8000/generate-podcast');

    socketRef.current.onopen = () => {
      socketRef.current?.send(JSON.stringify({ topic, duration }));
    };

    socketRef.current.onmessage = (event) => {
      if (event.data instanceof Blob) {
        const audioUrl = URL.createObjectURL(event.data);
        audioQueue.current.push(audioUrl);
        if (!audioRef.current?.src) {
          playNextAudio();
        }
      } else {
        const data = JSON.parse(event.data);
        if (data.status === 'initial' || data.status === 'completed') {
          setConversation(data.conversation);
        } else if (data.message) {
          setConversation(prev => [...prev, data.message]);
        }
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('An error occurred while connecting to the server.');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [topic, duration]);

  const playNextAudio = () => {
    if (audioQueue.current.length > 0) {
      const nextAudioUrl = audioQueue.current.shift();
      if (audioRef.current) {
        audioRef.current.src = nextAudioUrl!;
        audioRef.current.play();
      }
    }
  };

  const handleAudioEnd = () => {
    setCurrentAudioIndex(prev => prev + 1);
    playNextAudio();
    
    // Only send 'ready_for_next' after the first two audio files
    if (currentAudioIndex >= 1) {
      socketRef.current?.send(JSON.stringify({ type: 'ready_for_next' }));
    }
  };

  const askQuestion = async () => {
	setIsAskingQuestion(true);
	setError(null);
	try {
	  const response = await fetch('http://localhost:8000/ask', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({ question }),
	  });
	  if (!response.ok) {
		throw new Error('Failed to ask question');
	  }
	  const data = await response.json();
  
	  // Remove the last audio file from the queue
	  audioQueue.current.pop();
  
	  // Update the conversation state
	  setConversation(prev => {
		const newConversation = [...prev];
		newConversation.pop(); // Remove the last AI-generated message
		return [...newConversation, `Listener: ${question}`, `Expert: ${data.answer}`];
	  });
  
	  // Decrement the current audio index
	  setCurrentAudioIndex(prev => Math.max(0, prev - 1));
  
	  setQuestion('');
	} catch (error) {
	  console.error('Error asking question:', error);
	  setError('Failed to ask the question. Please try again.');
	} finally {
	  setIsAskingQuestion(false);
	}
  };

  const toggleAudio = () => {
    if (audioRef.current?.paused) {
      audioRef.current.play();
    } else {
      audioRef.current?.pause();
    }
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-y-auto">
        {conversation.map((message, index) => (
          <p key={index} className="mb-2">
            {message}
          </p>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Ask a question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="p-2 border rounded flex-grow"
        />
        <button
          onClick={askQuestion}
          disabled={isAskingQuestion}
          className="bg-black text-white p-2 rounded"
        >
          {isAskingQuestion ? 'Asking...' : 'Ask'}
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <audio 
          ref={audioRef} 
          onEnded={handleAudioEnd} 
          className="w-full" 
          controls
        />
        <button onClick={toggleAudio} className="bg-black text-white p-2 rounded">
          {audioRef.current?.paused ? 'Play' : 'Pause'}
        </button>
      </div>
      <p>Current Audio: {currentAudioIndex + 1}</p>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}