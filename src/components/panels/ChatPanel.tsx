'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@nextui-org/react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 p-4 mb-4 overflow-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-lg max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-secondary'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button
          color="primary"
          isIconOnly
          onClick={handleSend}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 