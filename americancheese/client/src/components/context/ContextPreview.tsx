import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContextData } from '../../../../shared/context-types';
import {
  generateContextXml,
  generateFullContextXml,
} from '../../../../shared/context-xml-generator';
import { safeJsonParseObject } from '@/lib/safe-json';

export interface ContextPreviewProps {
  /** Context data to preview */
  context: ContextData | string | null;
  /** Entity ID override */
  entityId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show header with actions */
  showHeader?: boolean;
  /** Include XML declaration and comments */
  fullXml?: boolean;
  /** Max height for scrollable content */
  maxHeight?: string;
  /** Compact mode */
  compact?: boolean;
}

export function ContextPreview({
  context,
  entityId,
  className,
  showHeader = true,
  fullXml = false,
  maxHeight = '300px',
  compact = false,
}: ContextPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Parse context if string
  const parsedContext: ContextData | null = useMemo(() => {
    if (!context) return null;
    if (typeof context === 'string') {
      return safeJsonParseObject(context, null, false);
    }
    return context;
  }, [context]);

  // Generate XML
  const xml = useMemo(() => {
    if (!parsedContext) return '';
    return fullXml
      ? generateFullContextXml(parsedContext, entityId)
      : generateContextXml(parsedContext, entityId);
  }, [parsedContext, entityId, fullXml]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download as file
  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-${entityId || 'export'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Syntax highlight XML (simple version)
  const highlightedXml = useMemo(() => {
    if (!xml) return null;

    return xml.split('\n').map((line, i) => {
      // Highlight tags
      const highlighted = line
        .replace(/(&lt;|<)(\/?[\w_-]+)/g, '<span class="text-blue-400">$1$2</span>')
        .replace(/([\w_-]+)(>|&gt;)/g, '$1<span class="text-blue-400">$2</span>')
        .replace(/(&lt;!--.*?--&gt;|<!--.*?-->)/g, '<span class="text-slate-500">$1</span>')
        .replace(/(id|version|encoding)=/g, '<span class="text-purple-400">$1</span>=')
        .replace(/"([^"]*)"/g, '"<span class="text-yellow-300">$1</span>"');

      return (
        <div key={i} className="flex">
          <span className="text-slate-600 w-8 text-right pr-2 select-none">
            {i + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      );
    });
  }, [xml]);

  if (!parsedContext) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No context data to preview</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 text-xs bg-slate-800/80"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div
          className="bg-slate-900 rounded-md p-3 overflow-auto font-mono text-xs"
          style={{ maxHeight }}
        >
          <pre className="text-green-400 whitespace-pre-wrap">{xml}</pre>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <CardHeader className="py-3 px-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode2 className="h-4 w-4" />
                XML Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Generated context for AI/LLM consumption
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-7 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadXml}
                className="h-7 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div
          className="bg-slate-900 p-4 overflow-auto font-mono text-xs"
          style={{ maxHeight }}
        >
          <div className="text-green-400">{highlightedXml}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextPreview;
