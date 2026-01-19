import React, { useState, useEffect, useRef } from 'react';
import { Message, JointConfig, SimulationState } from '../types';
import { generateTechnicalAnalysis } from '../services/geminiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface AssistantProps {
  selectedJoint: JointConfig;
  simState: SimulationState;
}

export const Assistant: React.FC<AssistantProps> = ({ selectedJoint, simState }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '你好，工程师。我是 AI 技术助手，可以为您提供有关所选膨胀节的技术细节、EJMA 标准或材料选择方面的帮助。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setLoading(true);

    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    // API Call
    const responseText = await generateTechnicalAnalysis(userMsg, selectedJoint, simState);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-eng-800 border-l border-eng-700">
      <div className="p-4 border-b border-eng-700 bg-eng-900/50 flex items-center gap-2">
        <Bot className="text-eng-accent" size={20} />
        <h3 className="font-semibold text-white">AI 技术助手</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`mt-1 min-w-[28px] h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-eng-600' : 'bg-eng-accent'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-eng-600 text-white' : 'bg-eng-700 text-gray-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="mt-1 w-7 h-7 rounded-full bg-eng-accent flex items-center justify-center">
               <Loader2 size={16} className="animate-spin" />
             </div>
             <div className="p-3 rounded-lg bg-eng-700 text-gray-400 text-sm">
               正在分析仿真参数...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-eng-700 bg-eng-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="询问关于应力、疲劳或材料的问题..."
            className="flex-1 bg-eng-900 border border-eng-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-eng-accent"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-eng-accent hover:bg-sky-600 disabled:opacity-50 text-white p-2 rounded-md transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};