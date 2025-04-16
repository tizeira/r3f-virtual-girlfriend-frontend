import { createContext, useContext, useEffect, useState } from "react";
import { Conversation } from '@11labs/client';
import * as Tone from 'tone';

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

const ChatContext = createContext();

// Mapeo de fonemas a visemas
const phonemeToViseme = {
  'a': 'D', // AA
  'e': 'C', // I
  'i': 'C', // I
  'o': 'E', // O
  'u': 'F', // U
  'p': 'A', // PP
  'b': 'A', // PP
  'm': 'A', // PP
  'k': 'B', // kk
  'g': 'B', // kk
  'f': 'G', // FF
  'v': 'G', // FF
  'th': 'H', // TH
  default: 'X' // PP
};

export const ChatProvider = ({ children }) => {
  // State for all chat messages (history)
  const [chatHistory, setChatHistory] = useState([]);
  // Current message being processed by the avatar
  const [message, setMessage] = useState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);

  const chat = async (userMessage) => {
    setLoading(true);
    
    // Add user message to chat history
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      liked: null
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    
    try {
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const resp = (await data.json()).messages;
      setMessages((messages) => [...messages, ...resp]);
      
      // Add avatar response to chat history after it's received
      if (resp && resp.length > 0) {
        const botMsg = {
          id: Date.now() + 1,
          text: resp[0].text,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          liked: null
        };
        
        setChatHistory(prev => [...prev, botMsg]);
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
      // Optionally add an error message to chat history
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  const toggleLike = (messageId, isLike) => {
    setChatHistory(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, liked: isLike ? true : (isLike === false ? false : null) }
          : msg
      )
    );
  };

  const generateVisemes = async (audioBuffer, text) => {
    const analyzer = new Tone.Analyser('waveform', 1024);
    const player = new Tone.Player().connect(analyzer);
    
    // Convertir el mensaje en fonemas básicos
    const phonemes = text.toLowerCase().split('').map(letter => {
      for (const [key, value] of Object.entries(phonemeToViseme)) {
        if (key === letter) return value;
      }
      return phonemeToViseme.default;
    });

    // Crear cues de lipsync basados en el análisis de audio
    const lipsyncData = {
      mouthCues: []
    };

    await Tone.start();
    player.buffer = audioBuffer;
    player.start();

    const interval = 0.1; // Intervalo de actualización en segundos
    let currentTime = 0;

    while (currentTime < player.buffer.duration) {
      const waveform = analyzer.getValue();
      const amplitude = Math.max(...waveform.map(Math.abs));
      
      // Seleccionar visema basado en amplitud y fonemas
      const phonemeIndex = Math.floor((currentTime / player.buffer.duration) * phonemes.length);
      const viseme = amplitude > 0.1 ? phonemes[phonemeIndex] || 'X' : 'X';

      lipsyncData.mouthCues.push({
        value: viseme,
        start: currentTime,
        end: currentTime + interval
      });

      currentTime += interval;
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }

    player.stop();
    player.dispose();
    analyzer.dispose();

    return lipsyncData;
  };

  const startVoiceCall = async () => {
    if (isCallActive || conversation) return; // Prevenir múltiples llamadas

    try {
      // Solicitar permiso para el micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const newConversation = await Conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        onConnect: () => {
          setIsCallActive(true);
          console.log("Conectado a ElevenLabs");
        },
        onDisconnect: () => {
          setIsCallActive(false);
          setConversation(null);
          console.log("Desconectado de ElevenLabs");
        },
        onError: (error) => {
          console.error("Error en la conversación:", error);
          setIsCallActive(false);
          setConversation(null);
        },
        onModeChange: async (mode) => {
          console.log("Modo de conversación:", mode.mode);
          if (mode.mode === 'speaking') {
            // Cuando la IA está hablando, generar lipsync
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(mode.audio);
            const lipsyncData = await generateVisemes(audioBuffer, mode.text);
            
            // Actualizar el mensaje actual con los datos de lipsync
            setMessage(prev => ({
              ...prev,
              lipsync: lipsyncData,
              audio: mode.audio,
              text: mode.text
            }));
          }
        },
      });

      setConversation(newConversation);
    } catch (error) {
      console.error("Error al iniciar la conversación:", error);
      setIsCallActive(false);
    }
  };

  const endVoiceCall = async () => {
    if (conversation) {
      await conversation.endSession();
      setConversation(null);
      setIsCallActive(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
        chatHistory,
        toggleLike,
        startVoiceCall,
        endVoiceCall,
        isCallActive
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};