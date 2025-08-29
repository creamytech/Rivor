"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  FileText,
  Paperclip
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onAttachmentUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    url?: string;
  }>;
  onRemoveAttachment?: (id: string) => void;
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  onAttachmentUpload,
  placeholder = "Write your message...",
  attachments = [],
  onRemoveAttachment
}: RichTextEditorProps) {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onAttachmentUpload) return;

    for (const file of Array.from(files)) {
      try {
        await onAttachmentUpload(file);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Simple Toolbar */}
      <div className="border-b p-2 bg-muted/30">
        <div className="flex items-center gap-1">
          <div className="text-xs text-muted-foreground px-2">
            Basic formatting available - full rich text editor loading...
          </div>
          
          <div className="ml-auto flex items-center gap-1">
            {/* File Attachments */}
            {onAttachmentUpload && (
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px]">
        <Textarea 
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] border-0 resize-none focus:ring-0 focus:ring-offset-0"
        />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="border-t p-3 bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm font-medium">Attachments ({attachments.length})</span>
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-background border rounded"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</div>
                  </div>
                </div>
                {onRemoveAttachment && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttachment(attachment.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}