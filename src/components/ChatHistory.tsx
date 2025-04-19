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

  const filteredChats = savedChats?.filter((_chat: SavedChat) => {
    const matchesSearch = _chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      _chat.messages.some((_msg: Message) => _msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every((_tag: string) => _chat.tags?.includes(_tag));
    return matchesSearch && matchesTags;
  }) || [];

  const allTags = Array.from(new Set(
    savedChats?.flatMap(_chat => _chat.tags || []) || []
  ));

  const handleChatSelect = async (_chatId: string) => {
    await loadChat(_chatId);
    setIsOpen(false);
  };

  const handleExport = async (_chat: SavedChat) => {
    await downloadAsDocx(_chat);
  };

  const toggleTag = (_tag: string) => {
    setSelectedTags((_prev: string[]) =>
      _prev.includes(_tag)
        ? _prev.filter((_t: string) => _t !== _tag)
        : [..._prev, _tag]
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
                  onChange={(_e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(_e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={18} height={18} />
              </div>

              {allTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allTags.map(_tag => (
                    <button
                      key={_tag}
                      onClick={() => toggleTag(_tag)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs transition-colors ${
                        selectedTags.includes(_tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {_tag}
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
                filteredChats.map(_chat => (
                  <div key={_chat.id} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => handleChatSelect(_chat.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="font-medium">{_chat.title}</h3>
                        <div className="text-sm text-gray-400 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(_chat.timestamp)} ago
                        </div>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExport(_chat)}
                          className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                          title="Export as DOCX"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(_chat.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete chat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {_chat.tags && _chat.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {_chat.tags.map(_tag => (
                          <span
                            key={_tag}
                            className="px-2 py-0.5 rounded-full bg-gray-600 text-xs text-gray-300"
                          >
                            {_tag}
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
