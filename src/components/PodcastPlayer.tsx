import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from './AudioVisualizer';

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
	const [conversation, setConversation] = useState<string[]>([]);
	const [visibleConversation, setVisibleConversation] = useState<string[]>([]);
	const [question, setQuestion] = useState('');
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTranscript, setShowTranscript] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	const backgroundAudioRef = useRef<HTMLAudioElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const audioQueue = useRef<string[]>([]);
	const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	const [isThundering, setIsThundering] = useState(false);
	const thunderAudioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		setIsLoading(true);
		startBackgroundAudio();
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
			//   setError('An error occurred while connecting to the server.');
			setIsLoading(false);
		};

		socketRef.current.onclose = () => {
			console.log('WebSocket closed');
		};

		return () => {
			if (socketRef.current) {
				socketRef.current.close();
			}
			if (backgroundAudioRef.current) {
				backgroundAudioRef.current.pause();
				backgroundAudioRef.current.currentTime = 0;
			}
		};
	}, [topic, duration]);

	useEffect(() => {
		if (conversation.length > 1) {
			const timer = setTimeout(() => {
				setVisibleConversation(conversation.slice(1));
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [conversation]);

	useEffect(() => {
		const thunderInterval = setInterval(() => {
		  if (Math.random() < 0.1) {  // 10% chance of thunder every interval
			triggerThunder();
		  }
		}, 30000);  // Check every 30 seconds
	
		return () => clearInterval(thunderInterval);
	  }, []);
	
	  const triggerThunder = () => {
		setIsThundering(true);
		if (thunderAudioRef.current) {
		  thunderAudioRef.current.play().catch(e => console.error("Error playing thunder:", e));
		}
		setTimeout(() => setIsThundering(false), 1000);
	  };

	const startBackgroundAudio = () => {
		if (backgroundAudioRef.current) {
			backgroundAudioRef.current.src = '/rain.mp3';
			backgroundAudioRef.current.loop = true;
			backgroundAudioRef.current.volume = 0.25;
			backgroundAudioRef.current.play().catch(e => console.error("Error playing background audio:", e));
		}
	};

	const playNextAudio = () => {
		if (audioQueue.current.length > 0) {
			const nextAudioUrl = audioQueue.current.shift();
			if (audioRef.current) {
				audioRef.current.src = nextAudioUrl!;
				audioRef.current.play().catch(e => console.error("Error playing audio:", e));
				setIsPlaying(true);
				setIsLoading(false);
			}
		}
	};

	const handleAudioEnd = () => {
		setCurrentAudioIndex(prev => prev + 1);
		playNextAudio();
    
		if (currentAudioIndex >= 1) {
			socketRef.current?.send(JSON.stringify({ type: 'ready_for_next' }));
		}
	};

	const askQuestion = async () => {
		setIsRecording(false);
		setError(null);
		setIsLoading(true);
    
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
		}
    
		audioQueue.current.pop();
		audioQueue.current.pop();
		setCurrentAudioIndex(prev => Math.max(0, prev - 2));

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

			setQuestion('');
			playNextAudio();
		} catch (error) {
			console.error('Error asking question:', error);
			setError('Failed to ask the question. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const togglePlayPause = () => {
		if (audioRef.current?.paused) {
			audioRef.current.play().catch(e => console.error("Error playing audio:", e));
			setIsPlaying(true);
		} else {
			audioRef.current?.pause();
			setIsPlaying(false);
		}
	};

	const toggleRecording = () => {
		if (isRecording) {
			setIsRecording(false);
			if (audioRef.current && isPlaying) {
				audioRef.current.play().catch(e => console.error("Error resuming audio:", e));
			}
		} else {
			setIsRecording(true);
			if (audioRef.current) {
				audioRef.current.pause();
				setIsPlaying(false);
			}
		}
	};

	const toggleTranscript = () => {
		setShowTranscript(!showTranscript);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-8 relative overflow-hidden">
		  {isThundering && (
			<div className="absolute inset-0 bg-white opacity-75 z-10 animate-flash"></div>
		  )}
		  <div className="w-full max-w-md bg-[#aed8df] bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-lg p-8 relative z-20">
			<AudioVisualizer 
			  isPlaying={isPlaying}
			  isRecording={isRecording}
			  isLoading={isLoading}
			  topic={topic}
			  audioRef={audioRef}
			/>
		
				<div className="mt-8 flex justify-between">
					<button onClick={togglePlayPause} className="p-4 bg-[#a5dbe6] hover:bg-[#c1e5eb] text-white rounded-full hover:scale-105 duration-300 shadow-lg">
						{isPlaying ? '⏸' : '▶'}
					</button>
					<button onClick={toggleRecording} className="p-4 bg-[#a5dbe6] hover:bg-[#c1e5eb] text-white rounded-full hover:scale-105 duration-300 shadow-lg">
						{isRecording ? '⏹' : '🎙'}
					</button>
					<button
						onClick={toggleTranscript}
						className="p-4 bg-[#a5dbe6] hover:bg-[#c1e5eb] text-white rounded-full hover:scale-105 duration-300 shadow-lg"
						aria-label="Toggle transcript"
					>
						💬
					</button>
				</div>
		
				{isRecording && (
					<div className="mt-6">
						<textarea
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							placeholder="Type your question here..."
							className=" w-full p-3 border focus:outline-none border-blue-300 rounded-lg bg-white bg-opacity-50 resize-none"
							rows={3}
						/>
						<button onClick={askQuestion} className="mt-2 w-full hover:scale-x-[102%] duration-300 bg-[#a5dbe6] hover:bg-[#c1e5eb] text-white p-3 rounded-lg shadow-lg">
							Send Question
						</button>
					</div>
				)}
		
				<audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
				<audio ref={backgroundAudioRef} className="hidden" />
				<audio ref={thunderAudioRef} src="/thunder.mp3" className="hidden" />
		
				{error && <p className="text-red-500 mt-4 text-center">{error}</p>}
  
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