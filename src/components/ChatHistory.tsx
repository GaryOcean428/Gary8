import React, { useState } from 'react';
import { History, Search, Download, Tag, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useChat } from '../hooks/useChat';
import type { SavedChat, Message } from '../types';
import { downloadAsDocx } from '../utils/export';

export function ChatHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { savedChats, loadChat, deleteChat } = useChat();
  // const autoTagger = AutoTagger.getInstance(); // Removed unused variable

  const filteredChats = savedChats?.filter((chat: SavedChat) => { // Add type for chat
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.messages.some((msg: Message) => msg.content.toLowerCase().includes(searchTerm.toLowerCase())); // Add type for msg
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every((tag: string) => chat.tags?.includes(tag)); // Add type for tag
    return matchesSearch && matchesTags;
  }) || [];

  const allTags = Array.from(new Set(
    savedChats?.flatMap(chat => chat.tags || []) || []
  ));

  const handleChatSelect = async (chatId: string) => {
    await loadChat(chatId);
    setIsOpen(false);
  };

  const handleExport = async (chat: SavedChat) => {
    await downloadAsDocx(chat);
  };

  const toggleTag = (tag: string) => { // Type for tag already provided
    setSelectedTags((prev: string[]) => // Add type for prev
      prev.includes(tag) 
        ? prev.filter((t: string) => t !== tag) // Add type for t
        : [...prev, tag]
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`transition-all duration-200 ease-in-out ${isOpen ? 'w-96' : 'w-auto'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors"
          title="Chat History"
        >
          <History className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} // Add type for e
                  placeholder="Search conversations..."
                  className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {allTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto p-2 space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No chats found
                </div>
              ) : (
                filteredChats.map(chat => (
                  <div key={chat.id} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => handleChatSelect(chat.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="font-medium">{chat.title}</h3>
                        <div className="text-sm text-gray-400 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(chat.timestamp)} ago
                        </div>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExport(chat)}
                          className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                          title="Export as DOCX"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete chat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {chat.tags && chat.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {chat.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-gray-600 text-xs text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
