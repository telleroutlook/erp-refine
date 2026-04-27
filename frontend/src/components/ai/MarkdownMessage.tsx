import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github.css';

interface MarkdownMessageProps {
  content: string;
}

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeSanitize, rehypeHighlight];

const MD_COMPONENTS = {
  pre: ({ children }: any) => (
    <pre style={{
      background: 'var(--md-code-bg)',
      border: '1px solid var(--md-code-border)',
      borderRadius: 8,
      padding: '12px 16px',
      overflowX: 'auto',
      fontSize: 12,
      lineHeight: 1.6,
      margin: '8px 0',
    }}>
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }: any) => {
    const isBlock = !!className;
    return isBlock ? (
      <code className={className} {...props}>{children}</code>
    ) : (
      <code style={{
        background: 'var(--md-code-inline-bg)',
        color: 'var(--md-code-inline-color)',
        padding: '1px 5px',
        borderRadius: 4,
        fontSize: '0.875em',
        fontFamily: 'var(--font-code, ui-monospace, monospace)',
      }} {...props}>{children}</code>
    );
  },
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
      }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{
      border: '1px solid var(--md-table-border)',
      padding: '6px 12px',
      background: 'var(--md-table-header-bg)',
      fontWeight: 600,
      textAlign: 'left',
    }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{
      border: '1px solid var(--md-table-border)',
      padding: '6px 12px',
    }}>
      {children}
    </td>
  ),
  blockquote: ({ children }: any) => (
    <blockquote style={{
      borderLeft: '3px solid var(--md-blockquote-border)',
      margin: '8px 0',
      paddingLeft: 12,
      color: 'var(--md-blockquote-text)',
      background: 'var(--md-blockquote-bg)',
      borderRadius: '0 4px 4px 0',
    }}>
      {children}
    </blockquote>
  ),
  p: ({ children }: any) => <p style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontSize: 20, margin: '12px 0 8px', fontWeight: 600 }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: 16, margin: '12px 0 4px', fontWeight: 600 }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontWeight: 600 }}>{children}</h3>,
  ul: ({ children }: any) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ margin: '2px 0' }}>{children}</li>,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--md-link-color)' }}>
      {children}
    </a>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--md-hr-color)', margin: '12px 0' }} />,
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MD_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
