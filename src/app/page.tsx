/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client"

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { fetchMessages, saveMessage } from '@/lib/messagesAPI';
import { supabase } from '@/lib/supabaseClient'; // Correct import

interface Message {
  id: string;
  role?: string; // Optional for messages from the database
  text: string;
  created_at?: string; // Optional for messages from the database
  isUser: boolean;
  timestamp: string;
  image?: string;
  mimeType?: string;
}

interface DbMessage {
  id: string;
  role: string; // 'user' or 'assistant'
  text: string;
  created_at: string;
  user_id?: string;
  image_url?: string;
}

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

useEffect(() => {
  async function checkAuth() {
    if (user) {
      console.log("Auth0 user:", user);
      
      try {
        // Check if we already have a supabaseServer session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Syncing Auth0 with supabaseServer...");
          
          const syncResponse = await fetch('/api/auth/supabaseServer-session');
          const syncResult = await syncResponse.json();

          console.log("Sync result:", syncResult);
          
          if (syncResult.success) {
            // Set the supabaseServer session
            await supabase.auth.setSession({
              access_token: syncResult.session.access_token,
              refresh_token: syncResult.session.refresh_token
            });
            console.log("Successfully synced sessions");
          } else {
            console.error("Failed to sync sessions:", syncResult.error);
          }
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      }
    }
  }
  checkAuth();
}, [user]);

  // Initialize welcome message for authenticated users
  useEffect(() => {
    if (user && messages.length === 0 && !isLoadingMessages) {
      // First time user welcome message will be handled by fetchMessages
    }
  }, [user, messages.length, isLoadingMessages]);

  // Load messages when user is authenticated
  useEffect(() => {
    if (user) {
      setIsLoadingMessages(true);
      loadMessages();
    }
  }, [user]);

  // Fetch messages using the external API
  const loadMessages = async () => {
    try {
      const data = await fetchMessages();
      
      // Map DB messages to UI format
      const uiMessages = data.map((dbMsg: DbMessage) => ({
        id: dbMsg.id,
        text: dbMsg.text,
        isUser: dbMsg.role === 'user',
        timestamp: new Date(dbMsg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        image: dbMsg.image_url,
        mimeType: dbMsg.image_url ? 'image/jpeg' : undefined
      }));
      
      setMessages(uiMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading state
  if (isLoading || isLoadingMessages) {
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

  // Add to your component after login

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
    // FIXED: This was returning early if text existed (opposite of intended behavior)
    if (!inputText.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Optimistic UI update
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);
    
    // Modify the saveMessage call to handle failures better
    try {
      // Save user message using external API
      const savedUser = await saveMessage('user', userMessage.text);
      
      // Replace temp message with saved DB version
      setMessages(prev => prev.map(m => 
        m.id === tempId ? {
          ...m,
          id: savedUser.id,
          created_at: savedUser.created_at
        } : m
      ));
    } catch (saveError) {
      console.error('Failed to save user message:', saveError);
      // Continue with local message only (will not persist on refresh)
      console.log('Continuing with local-only message');
    }

    try {
      // Check if user wants image generation (simple keyword detection)
      const isImageRequest = currentInput.toLowerCase().includes('generate image') || 
                          currentInput.toLowerCase().includes('generate an image of a') || 
                           currentInput.toLowerCase().includes('create image') ||
                           currentInput.toLowerCase().includes('draw') ||
                           currentInput.toLowerCase().includes('picture of');

      if (isImageRequest) {
        try {
          // Generate image using Hugging Face Stable Diffusion XL
          const imageUrl = await generateImage(currentInput);
          
          const aiResponse: Message = {
            id: `temp-ai-${Date.now()}`,
            text: `Here's the image I generated for: "${currentInput}"`,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image: imageUrl,
            mimeType: 'image/jpeg'
          };
          
          setMessages(prev => [...prev, aiResponse]);
      
          // Save AI response to database using external API
          const savedAI = await saveMessage('assistant', aiResponse.text, imageUrl);
          
          // Update with DB ID
          setMessages(prev => prev.map(m => 
            m.id === aiResponse.id ? {
              ...m,
              id: savedAI.id,
              created_at: savedAI.created_at
            } : m
          ));
        } catch (imageError) {
          console.error('Image generation failed:', imageError);
          const errorResponse: Message = {
            id: `temp-err-${Date.now()}`,
            text: "Sorry, I couldn't generate the image. The model might be loading or there's a quota limit. Please try again in a few moments.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, errorResponse]);
          
          // Save error response
          await saveMessage('assistant', errorResponse.text);
        }
      } else {
        // Use Gemini for text responses
        const aiResponseText = await sendToGemini(currentInput);
        
        const aiResponse: Message = {
          id: `temp-ai-${Date.now()}`,
          text: aiResponseText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, aiResponse]);

        // Save AI response using external API
        const savedAI = await saveMessage('assistant', aiResponseText);
        
        // Update with DB ID
        setMessages(prev => prev.map(m => 
          m.id === aiResponse.id ? {
            ...m,
            id: savedAI.id,
            created_at: savedAI.created_at
          } : m
        ));
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorResponse: Message = {
        id: `err-${Date.now()}`,
        text: "Sorry, I'm experiencing technical difficulties. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorResponse]);
      
      // Attempt to save error response
      try {
        await saveMessage('assistant', errorResponse.text);
      } catch (saveError) {
        console.error('Failed to save error response:', saveError);
      }
    } finally {
      setIsTyping(false);
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
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${res.status}`);
      }
      
      const data = await res.json();
      return data.text || "Sorry, I couldn't generate a response.";
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
          <span className="text-light small me-2">{user.name}</span>
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
            // onKeyPress={handleKeyPress}
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