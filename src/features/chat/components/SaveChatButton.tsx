import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useChatStore } from '../hooks/useChatStore';
import type { Message } from '../../../types';

interface SaveChatButtonProps {
  messages: Message[];
  onSave?: () => void;
}

export function SaveChatButton({ messages, onSave }: SaveChatButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveChat } = useChatStore();

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
        className="p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors"
        title="Save Chat"
      >
        <Save className="w-5 h-5" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Chat</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
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
                  className="w-full bg-input rounded px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter a title for this chat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(_e) => setTags(_e.target.value)}
                  className="w-full bg-input rounded px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter tags, separated by commas"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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