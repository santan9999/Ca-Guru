'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  format?: string;
}

/**
 * A component that renders markdown content with proper formatting
 * Supports various formats like tables, lists, flowcharts, etc.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, format = 'default' }) => {
  // Filter out the prompt text that asks for deeper explanation and remove unwanted icons
  const filteredContent = React.useMemo(() => {
    if (!content) return '';
    
    // Remove the example section, prompt text, and notes
    let filtered = content
      // Remove the entire example section with Direct Tax and Indirect Tax
      .replace(/Example:[\s\S]*?(?:Direct Tax|Indirect Tax)[\s\S]*?(?=\n\n|$)/g, '')
      // Remove any "Would you like" questions
      .replace(/Would you like[\s\S]*?\?/g, '')
      // Remove the note about ICAI references
      .replace(/Note:[\s\S]*?Indian tax laws\./g, '')
      .trim();
    
    return filtered;
  }, [content]);
  
  // CSS class to hide unwanted icons that might be in the content
  const hideIconsStyle = `
    .markdown-content svg {
      display: none;
    }
  `;
  // Apply specific styling based on the format type
  const getFormatClass = () => {
    switch (format) {
      case 'flowchart':
        return 'font-mono whitespace-pre-wrap';
      case 'table':
        return 'markdown-table';
      case 'list':
        return 'markdown-list';
      case 'comparison':
        return 'markdown-comparison';
      default:
        return '';
    }
  };

  return (
    <div className={`markdown-content ${getFormatClass()}`}>
      <ReactMarkdown>
        {filteredContent}
      </ReactMarkdown>
      
      {/* Add style to hide unwanted icons */}
      <style jsx global>{hideIconsStyle}</style>
      
      {/* Add global styles for markdown content */}
      <style jsx global>{`
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .markdown-content h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .markdown-content p {
          margin-bottom: 1rem;
        }
        
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .markdown-content ul {
          list-style-type: disc;
        }
        
        .markdown-content ol {
          list-style-type: decimal;
        }
        
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          margin-bottom: 1rem;
          width: 100%;
        }
        
        .markdown-content table th,
        .markdown-content table td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem;
        }
        
        .markdown-content table th {
          background-color: #f8fafc;
          font-weight: bold;
        }
        
        .markdown-content pre {
          background-color: #f8fafc;
          border-radius: 0.25rem;
          padding: 1rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        
        .markdown-content code {
          background-color: #f1f5f9;
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: monospace;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 1rem;
          color: #64748b;
        }
        
        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .markdown-content table th,
          .markdown-content table td {
            border-color: #334155;
          }
          
          .markdown-content table th {
            background-color: #1e293b;
          }
          
          .markdown-content pre {
            background-color: #1e293b;
          }
          
          .markdown-content code {
            background-color: #334155;
          }
          
          .markdown-content blockquote {
            border-left-color: #475569;
            color: #94a3b8;
          }
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;