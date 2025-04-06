import { useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const [showCallButton, setShowCallButton] = useState(true);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && text.trim()) {
      chat(text);
      input.current.value = "";
    }
  };

  const startCall = () => {
    setShowCallButton(false);
    setCameraZoomed(true);
    // Optionally trigger an initial greeting from the avatar
    setTimeout(() => {
      chat("Hello");
    }, 1000);
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        {/* Call button overlay on avatar */}
        {showCallButton && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <button
              onClick={startCall}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-all"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                />
              </svg>
              Start a call
            </button>
          </div>
        )}

        {/* Chat messages container */}
        {!showCallButton && (
          <div className="flex-1 overflow-y-auto pb-4 px-4 pointer-events-auto">
            <div className="flex flex-col gap-4 max-w-md mx-auto pt-8">
              {/* Sample received message */}
              <div className="flex flex-col">
                <div className="bg-gray-700 text-white p-3 rounded-lg rounded-tl-none self-start max-w-xs">
                  hola
                </div>
                <span className="text-xs text-gray-400 mt-1 ml-2">2:01 pm</span>
              </div>
              
              {/* Sample sent message */}
              <div className="flex flex-col items-end">
                <div className="bg-blue-600 text-white p-3 rounded-lg rounded-tr-none self-end max-w-xs">
                  ¡Hola! ¡Qué alegría verte! ¿Cómo estás?
                </div>
                <div className="flex items-center mt-1 mr-2">
                  <span className="text-xs text-gray-400 mr-2">2:02 pm</span>
                  <div className="flex gap-1">
                    <button className="text-gray-400 hover:text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Input area */}
        {!showCallButton && (
          <div className="flex items-center gap-2 pointer-events-auto w-full max-w-lg mx-auto">
            <div className="flex items-center w-full bg-gray-800 rounded-full overflow-hidden">
              <input
                className="w-full bg-transparent text-white p-3 px-5 outline-none"
                placeholder="Start a conversation"
                ref={input}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              <button
                disabled={loading || message}
                onClick={sendMessage}
                className={`bg-blue-600 hover:bg-blue-700 text-white p-3 m-1 rounded-full ${
                  loading || message ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};