import { useState, useEffect, useRef } from 'react';

export const usePodcastLogic = (topic: string, duration: number) => {
  const [conversation, setConversation] = useState<string[]>([]);
  const [visibleConversation, setVisibleConversation] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThundering, setIsThundering] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const thunderAudioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioQueue = useRef<string[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
      if (Math.random() < 0.7) {
        triggerThunder();
      }
    }, 25000);

    return () => clearInterval(thunderInterval);
  }, []);

  const triggerThunder = () => {
    setIsThundering(true);
    if (thunderAudioRef.current) {
      thunderAudioRef.current.volume = 0.3;
      thunderAudioRef.current.play().catch(e => console.error("Error playing thunder:", e));
    }
    setTimeout(() => setIsThundering(false), 1000);
  };

  const startBackgroundAudio = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.src = '/rain.mp3';
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.1;
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

    if (currentAudioIndex >= 0) {
      socketRef.current?.send(JSON.stringify({ type: 'ready_for_next' }));
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      setIsPlaying(true);
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
    }
  };

  const handleRecordStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data]);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
    }
  };

  const handleRecordStop = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      askQuestion();
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
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to ask question');
      }
      const data = await response.json();

      setAudioChunks([]);
      playNextAudio();
      if (currentAudioIndex >= 0) {
        socketRef.current?.send(JSON.stringify({ type: 'ready_for_next' }));
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setError("Try again. Try being clearer.");
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error resuming audio:", e));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conversation,
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
    setError,
  };
};