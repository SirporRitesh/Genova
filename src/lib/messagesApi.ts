import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Temporary local storage key for development
const LOCAL_MESSAGES_KEY = 'chatgpt_clone_messages';

export async function fetchMessages() {
  try {
    // First try to get authenticated session
    const { data: { session } } = await supabase.auth.getSession();

    console.log('Current session:', session);
    
    if (session) {
      // If authenticated, fetch from Supabase
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    } else {
      console.log("1222221")
      // Fallback to local storage when not authenticated
      console.log('No Supabase session, using local storage fallback');
      const storedMessages = localStorage.getItem(LOCAL_MESSAGES_KEY);
      return storedMessages ? JSON.parse(storedMessages) : [];
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Fallback to local storage
    const storedMessages = localStorage.getItem(LOCAL_MESSAGES_KEY);
    return storedMessages ? JSON.parse(storedMessages) : [];
  }
}

export async function saveMessage(role: 'user' | 'assistant', text: string, image_url?: string) {
  try {
    // Try to get authenticated session
    const { data: { session } } = await supabase.auth.getSession();

    console.log('Attempting to save message:', { role, text, image_url });
    console.log('Current session:', session);
    
    const newMessage = {
      id: uuidv4(),
      role,
      text: text || null,
      created_at: new Date().toISOString(),
      image_url: image_url || null
    };
    
    if (session) {
      console.log('Authenticated session found, saving to Supabase...', session);
      // If authenticated, save to Supabase
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          ...newMessage,
          user_id: userId
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Fallback to local storage when not authenticated
      console.log("1222222qqqqqq")
      console.log('No Supabase session, using local storage fallback');
      const storedMessages = localStorage.getItem(LOCAL_MESSAGES_KEY);
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      
      // Add user_id for consistency with DB schema
      const messageWithUserId = {
        ...newMessage,
        user_id: 'local-user'
      };
      
      messages.push(messageWithUserId);
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
      return messageWithUserId;
    }
  } catch (error) {
    console.error('Error saving message:', error);
    
    // Fallback to local storage
    const newMessage = {
      id: uuidv4(),
      role,
      text: text || null,
      created_at: new Date().toISOString(),
      user_id: 'local-user',
      image_url: image_url || null
    };
    
    const storedMessages = localStorage.getItem(LOCAL_MESSAGES_KEY);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    messages.push(newMessage);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
    
    return newMessage;
  }
}