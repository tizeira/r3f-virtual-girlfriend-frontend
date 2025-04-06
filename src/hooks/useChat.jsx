import { createContext, useContext, useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // State for all chat messages (history)
  const [chatHistory, setChatHistory] = useState([]);
  // Current message being processed by the avatar
  const [message, setMessage] = useState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(false);

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
        toggleLike
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