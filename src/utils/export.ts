import { SavedChat } from '../types';

export async function downloadAsDocx(_chat: SavedChat): Promise<void> {
  try {
    // Create a formatted document string
    let content = `# ${_chat.title}\n\n`;
    content += `Created: ${new Date(_chat.timestamp).toLocaleString()}\n\n`;
    
    if (_chat.tags?.length) {
      content += `Tags: ${_chat.tags.join(', ')}\n\n`;
    }
    
    content += '## Conversation\n\n';
    
    _chat.messages.forEach(_message => {
      const role = _message.role.charAt(0).toUpperCase() + _message.role.slice(1);
      content += `### ${role}\n${_message.content}\n\n`;
    });

    // Convert to blob and download
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${_chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chat:', error);
    throw error;
  }
}