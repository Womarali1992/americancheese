import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Utility function to parse text and convert URLs to clickable links
 * Supports both markdown-style links and plain URLs
 */
export function parseLinksInText(text: string): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      elements.push(<br key={`br-${lineIndex}`} />);
    }

    if (!line.trim()) {
      return;
    }

    // Combined regex to match both markdown links and plain URLs
    const linkRegex = /(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s<>]+)/g;
    let lastIndex = 0;
    let match;
    let elementIndex = 0;

    while ((match = linkRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = line.substring(lastIndex, match.index);
        if (beforeText) {
          elements.push(
            <span key={`text-${lineIndex}-${elementIndex++}`}>{beforeText}</span>
          );
        }
      }

      // Check if it's a markdown link or plain URL
      if (match[1]) {
        // Markdown link: [text](url)
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`markdown-${lineIndex}-${elementIndex++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            {linkText}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      } else if (match[4]) {
        // Plain URL
        const url = match[4];
        elements.push(
          <a
            key={`url-${lineIndex}-${elementIndex++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 break-all"
          >
            {url}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < line.length) {
      const remainingText = line.substring(lastIndex);
      if (remainingText) {
        elements.push(
          <span key={`text-${lineIndex}-${elementIndex++}`}>{remainingText}</span>
        );
      }
    }

    // If no matches found, add the whole line as text
    if (lastIndex === 0) {
      elements.push(
        <span key={`line-${lineIndex}`}>{line}</span>
      );
    }
  });

  return elements;
}

/**
 * Component to render text with clickable links
 */
interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const elements = parseLinksInText(text);
  
  return (
    <div className={className}>
      {elements}
    </div>
  );
}