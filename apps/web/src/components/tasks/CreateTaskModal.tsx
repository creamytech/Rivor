"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  User,
  Calendar,
  Flag,
  Tag,
  X
} from "lucide-react";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (task: any) => void;
}

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueAt: string;
  assignedTo: string;
  tags: string[];
}

export default function CreateTaskModal({
  open,
  onOpenChange,
  onTaskCreated
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueAt: '',
    assignedTo: '',
    tags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        onTaskCreated?.(newTask);
        onOpenChange(false);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          dueAt: '',
          assignedTo: '',
          tags: []
        });
      } else {
        console.error('Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        style={{ backgroundColor: 'var(--glass-surface)', color: 'var(--glass-text)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Task Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Task Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  required
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the task in detail"
                  rows={3}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueAt" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  <Input
                    id="dueAt"
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Enter assignee name"
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Tags</h3>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="glass-input"
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="liquid"
              disabled={loading || !formData.title}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}