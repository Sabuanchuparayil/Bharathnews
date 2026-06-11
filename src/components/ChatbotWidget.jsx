import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatWithAI } from '../services/ai';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI news assistant. Ask me about today's top stories, any topic, or news from India and GCC." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const reply = await chatWithAI(userInput);
      setMessages(prev => [...prev, { role: 'assistant', content: reply || "Sorry, I couldn't process that. Try again!" }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="floating-action"
            aria-label="Open AI Chat"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatTrapRef}
            role="dialog"
            aria-modal="true"
            aria-label="AI News Chat"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-[340px] sm:w-[380px] h-[500px] bg-white dark:bg-dark-surface-1 rounded-3xl shadow-floating border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-emerald rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">News AI</h3>
                  <p className="text-[10px] text-accent-emerald font-medium">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="p-2 hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-700 dark:text-gray-200 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-2 dark:bg-dark-surface-2 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about today's news..."
                  aria-label="Chat message"
                  className="flex-1 input-field py-2.5 text-sm rounded-xl"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {!user && <p className="text-[10px] text-gray-400 mt-2 text-center">Sign in for personalized answers</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
