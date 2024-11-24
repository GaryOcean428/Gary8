import React from 'react';
import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`animate-fade-in ${
            message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] ${
              message.role === 'user'
                ? 'bg-blue-600 rounded-l-lg rounded-tr-lg'
                : 'bg-gray-800 rounded-r-lg rounded-tl-lg'
            } p-4`}
          >
            <div className="flex flex-col">
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>{message.role === 'user' ? 'You' : 'Agent One'}</span>
                <span>{formatDistanceToNow(message.timestamp)} ago</span>
              </div>
              {message.model && (
                <div className="text-xs text-gray-500 mt-1">
                  {message.model}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}