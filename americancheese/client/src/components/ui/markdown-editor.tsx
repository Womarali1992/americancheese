import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link,
  Eye,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  rows = 5,
  className,
  disabled = false,
  autoFocus = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const newValue =
      value.substring(0, start) +
      before + selectedText + after +
      value.substring(end);

    onChange(newValue);

    // Restore cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleBold = () => insertMarkdown('**', '**', 'bold text');
  const handleItalic = () => insertMarkdown('*', '*', 'italic text');
  const handleHeading = () => insertMarkdown('## ', '', 'Heading');
  const handleBulletList = () => insertMarkdown('- ', '', 'List item');
  const handleNumberedList = () => insertMarkdown('1. ', '', 'List item');
  const handleLink = () => insertMarkdown('[', '](url)', 'link text');

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title
  }: {
    onClick: () => void;
    icon: React.ElementType;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-slate-200"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn('border rounded-md', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b bg-slate-50 px-2 py-1">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton onClick={handleBold} icon={Bold} title="Bold (Ctrl+B)" />
            <ToolbarButton onClick={handleItalic} icon={Italic} title="Italic (Ctrl+I)" />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={handleHeading} icon={Heading2} title="Heading" />
            <ToolbarButton onClick={handleBulletList} icon={List} title="Bullet list" />
            <ToolbarButton onClick={handleNumberedList} icon={ListOrdered} title="Numbered list" />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={handleLink} icon={Link} title="Insert link" />
          </div>

          {/* Edit/Preview tabs */}
          <TabsList className="h-7 bg-transparent">
            <TabsTrigger
              value="edit"
              className="text-xs h-6 px-2 data-[state=active]:bg-white"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-xs h-6 px-2 data-[state=active]:bg-white"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            autoFocus={autoFocus}
            className="border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div
            className="prose prose-sm max-w-none p-3 min-h-[120px] text-slate-700"
            style={{ minHeight: `${rows * 24 + 24}px` }}
          >
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-slate-400 italic">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Renders markdown content as formatted HTML
 * Use this for displaying saved markdown descriptions
 */
export function MarkdownContent({
  content,
  className
}: {
  content: string;
  className?: string;
}) {
  if (!content) {
    return null;
  }

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
