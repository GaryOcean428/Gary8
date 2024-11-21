import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '../lib/utils';

interface MarkdownContentProps {
  content: string;
}

const markdownComponents = {
  pre: ({ children, ...props }: any) => (
    <div className="relative group">
      <pre {...props} className="overflow-x-auto p-4 rounded-lg bg-gray-800/50 my-2">
        {children}
      </pre>
      <button
        onClick={() => {
          const code = children?.props?.children;
          if (code) {
            navigator.clipboard.writeText(code);
          }
        }}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Copy
      </button>
    </div>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-gray-800/50 text-sm" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn('block text-sm', className)} {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }: any) => (
    <p className="mb-4 leading-7 last:mb-0">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-4 list-disc pl-6 space-y-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-4 list-decimal pl-6 space-y-2">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-7">{children}</li>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-bold mb-3 mt-4">{children}</h3>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider bg-gray-800">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm border-t border-gray-700">
      {children}
    </td>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-300">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: any) => (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
    />
  )
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}