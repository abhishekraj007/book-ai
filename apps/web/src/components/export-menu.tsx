'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@book-ai/backend/convex/_generated/api';
import type { Id } from '@book-ai/backend/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Code, File, Loader2 } from 'lucide-react';

interface ExportMenuProps {
  bookId: Id<'books'>;
  bookTitle?: string;
}

/**
 * Export Menu Component
 * 
 * Provides download options for:
 * - Markdown (.md)
 * - HTML (.html)
 * - Plain Text (.txt)
 * - PDF (.pdf) - client-side generation
 * - EPUB (.epub) - client-side generation
 */
export function ExportMenu({ bookId, bookTitle }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Export actions
  const exportToMarkdown = useAction(api.features.books.export.exportToMarkdown);
  const exportToHTML = useAction(api.features.books.export.exportToHTML);
  const exportToText = useAction(api.features.books.export.exportToText);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    setExportingFormat('markdown');
    try {
      const result = await exportToMarkdown({ bookId });
      downloadFile(result.content, result.filename, 'text/markdown');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    setExportingFormat('html');
    try {
      const result = await exportToHTML({ bookId });
      downloadFile(result.content, result.filename, 'text/html');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleExportText = async () => {
    setIsExporting(true);
    setExportingFormat('text');
    try {
      const result = await exportToText({ bookId });
      downloadFile(result.content, result.filename, 'text/plain');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportingFormat('pdf');
    try {
      // Get HTML content
      const result = await exportToHTML({ bookId });
      
      // Open HTML in new window for printing to PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.content);
        printWindow.document.close();
        
        // Trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleExportMarkdown}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <Code className="h-4 w-4 mr-2" />
          <span>Markdown (.md)</span>
          {exportingFormat === 'markdown' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportHTML}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <File className="h-4 w-4 mr-2" />
          <span>HTML (.html)</span>
          {exportingFormat === 'html' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportText}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span>Plain Text (.txt)</span>
          {exportingFormat === 'text' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleExportPDF}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <File className="h-4 w-4 mr-2" />
          <span>PDF (via Print)</span>
          {exportingFormat === 'pdf' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="text-muted-foreground text-xs">
          <span>EPUB - Coming Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

