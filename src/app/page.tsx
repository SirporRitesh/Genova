"use client"

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  image?: string;
  mimeType?: string;
}

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message for authenticated users
  useEffect(() => {
    if (user && messages.length == 0) {
      // setMessages([{
      //   id: 1,
      //   text: `Hello ${user.name || 'there'}! I'm your AI assistant. How can I help you today?`,
      //   isUser: false,
      //   timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      // }]);
    }
  }, [user, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="landing-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-light">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="landing-container">
        {/* Fixed Header */}
        <div className="landing-header d-flex align-items-center justify-content-between px-3 py-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-list fs-4 text-light"></i>
          </div>
          <div>
            <button className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-plus"></i> Get Plus
            </button>
          </div>
          <div>
            <i className="bi bi-person-circle fs-4 text-light"></i>
          </div>
        </div>

        {/* Centered Body */}
        <div className="landing-body d-flex align-items-center justify-content-center">
          <div className="text-center">
            <h4 className="landing-title text-light mb-4">Ready when you are.</h4>
            <p className="text-muted mb-4">Please sign in to start chatting with AI</p>
            <a 
              href="/api/auth/login" 
              className="btn btn-primary btn-lg rounded-pill px-4"
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Sign In with Auth0
            </a>
          </div>
        </div>

        {/* Fixed Footer Input */}
        <div className="landing-footer">
          <div className="input-container-landing d-flex align-items-center">
            <button className="btn btn-outline-secondary me-2" disabled>
              <i className="bi bi-plus"></i>
            </button>
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Sign in to ask anything"
              disabled
            />
            <button className="btn btn-outline-secondary ms-2" disabled>
              <i className="bi bi-mic"></i>
            </button>
            <button className="btn btn-outline-secondary ms-1" disabled>
              <i className="bi bi-send"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate image using Hugging Face Stable Diffusion XL
  async function generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Image generation failed: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      return imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  // Enhanced message handler with image generation detection
  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newMessage]);
      const currentInput = inputText;
      setInputText('');
      setIsTyping(true);
      
      try {
        // Check if user wants image generation (simple keyword detection)
        const isImageRequest = currentInput.toLowerCase().includes('generate image') || 
                              currentInput.toLowerCase().includes('create image') ||
                              currentInput.toLowerCase().includes('draw') ||
                              currentInput.toLowerCase().includes('picture of');

        if (isImageRequest) {
          try {
            // Generate image using Hugging Face Stable Diffusion XL
            const imageUrl = await generateImage(currentInput);
            
            const aiResponse: Message = {
              id: Date.now() + 1,
              text: `Here's the image I generated for: "${currentInput}"`,
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              image: imageUrl,
              mimeType: 'image/jpeg'
            };
            setMessages(prev => [...prev, aiResponse]);
          } catch (imageError) {
            console.error('Image generation failed:', imageError);
            const errorResponse: Message = {
              id: Date.now() + 1,
              text: "Sorry, I couldn't generate the image. The model might be loading or there's a quota limit. Please try again in a few moments.",
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorResponse]);
          }
        } else {
          // Use Gemini for text responses
          const aiResponseText = await sendToGemini(currentInput);
          
          const aiResponse: Message = {
            id: Date.now() + 1,
            text: aiResponseText,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiResponse]);
        }
      } catch (error) {
        console.error('Failed to get AI response:', error);
        const errorResponse: Message = {
          id: Date.now() + 1,
          text: "Sorry, I'm experiencing technical difficulties. Please try again.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Send user input to Gemini-1.5-flash (text model)
  async function sendToGemini(prompt: string): Promise<string> {
    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.NEXT_PUBLIC_GEMINI_API_KEY || "", 
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }
      
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "Sorry, I'm having trouble connecting to the AI service. Please try again.";
    }
  }

  async function sendToGeminiImage(prompt: string): Promise<{ base64Image: string; mimeType: string }> {
    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();

      const part = data?.candidates?.[0]?.content?.parts?.[0]?.inline_data;
      if (part && part.data && part.mime_type) {
        return {
          base64Image: part.data,
          mimeType: part.mime_type,
        };
      } else {
        throw new Error("No image returned");
      }
    } catch (error) {
      console.error('Error calling Gemini Image API:', error);
      return { base64Image: "", mimeType: "" };
    }
  }

  const UserMessage = ({ message }: { message: Message }) => (
    <div className="d-flex justify-content-end mb-2 message-fade-in">
      <div className="user-message-bubble">
        <div className="message-text">{message.text}</div>
        <div className="message-timestamp-user">{message.timestamp}</div>
      </div>
    </div>
  );

  const AIMessage = ({ message }: { message: Message }) => (
    <div className="d-flex justify-content-start mb-2 message-fade-in">
      <div className="ai-message-bubble">
        {message.image ? (
          <div>
            <img
              src={message.image}
              alt="Generated by AI"
              style={{ 
                maxWidth: "100%", 
                borderRadius: "8px", 
                marginBottom: "8px",
                display: "block"
              }}
            />
            <div className="message-text small text-muted">{message.text}</div>
          </div>
        ) : (
          <div className="message-text">{message.text}</div>
        )}

        <div className="d-flex align-items-center justify-content-between mt-2">
          <div className="message-timestamp-ai">{message.timestamp}</div>
          <div className="message-actions">
            <button
              className="btn btn-sm message-action-btn"
              onClick={() => copyMessage(message.text)}
              title="Copy"
            >
              <i className="bi bi-files"></i>
            </button>
            <button
              className="btn btn-sm message-action-btn"
              title="Good response"
            >
              <i className="bi bi-hand-thumbs-up"></i>
            </button>
            <button
              className="btn btn-sm message-action-btn"
              title="Bad response"
            >
              <i className="bi bi-hand-thumbs-down"></i>
            </button>
            <button
              className="btn btn-sm message-action-btn"
              title="Retry"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="d-flex justify-content-start mb-2">
      <div className="ai-message-bubble typing-indicator">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  // Authenticated chat interface
  return (
    <div className="landing-container">
      {/* Fixed Header with User Info */}
      <div className="landing-header d-flex align-items-center justify-content-between px-3 py-2">
        <div className="d-flex align-items-center">
          <i className="bi bi-list fs-4 text-light"></i>
        </div>
        <div className="text-center">
          <span className="text-light small">ChatClone</span>
        </div>
        <div className="d-flex align-items-center">
          <a href="/api/auth/logout" className="text-light" title="Logout">
            <i className="bi bi-box-arrow-right fs-5"></i>
          </a>
        </div>
      </div>

      {/* Chat Messages Area */}
      {messages.length > 0 ? (
        <div className="messages-display">
          {messages.map(message => (
            message.isUser ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AIMessage key={message.id} message={message} />
            )
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="empty-chat-container d-flex flex-column align-items-center justify-content-center">
          <div className="text-center">
            <h4 className="empty-chat-title text-light mb-3">Ready when you are.</h4>
            <p className="text-muted">Ask anything</p>
          </div>
        </div>
      )}

      {/* Fixed Footer Input */}
      <div className="landing-footer">
        <div className="input-container-landing d-flex align-items-center">
          <button className="btn btn-outline-secondary me-2">
            <i className="bi bi-plus"></i>
          </button>
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Ask anything..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="btn btn-outline-secondary ms-2">
            <i className="bi bi-mic"></i>
          </button>
          <button 
            className="btn btn-primary ms-1"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <i className="bi bi-send"></i>
          </button>
        </div>
      </div>
    </div>
  );
}