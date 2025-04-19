import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { usePersistence } from '../hooks/usePersistence';
import type { Message } from '../types';

interface SaveChatButtonProps {
  messages: Message[];
  onSave?: () => void;
}

export function SaveChatButton({ messages, onSave }: SaveChatButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveChat } = usePersistence();

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const tagArray = tags.split(',').map(_tag => _tag.trim()).filter(Boolean);
      await saveChat(title, messages, tagArray);
      setIsModalOpen(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save chat:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
        title="Save Chat"
      >
        <Save className="w-5 h-5" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Chat</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(_e) => setTitle(_e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a title for this chat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(_e) => setTags(_e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags, separated by commas"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}