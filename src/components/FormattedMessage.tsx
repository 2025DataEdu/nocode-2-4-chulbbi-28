import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // 표 스타일링
          table: ({ children }) => (
            <table className="min-w-full border-collapse border border-border rounded-md my-2">
              {children}
            </table>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
          // 헤딩 스타일링
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 mt-4 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 mt-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-2 mt-3 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold mb-1 mt-2 text-foreground">
              {children}
            </h4>
          ),
          // 볼드 텍스트 스타일링
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          ),
          // 단락 스타일링
          p: ({ children }) => (
            <p className="mb-2 text-foreground leading-relaxed">
              {children}
            </p>
          ),
          // 리스트 스타일링
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground text-sm">
              {children}
            </li>
          ),
          // 인라인 코드 스타일링
          code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          // 코드 블록 스타일링
          pre: ({ children }) => (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
              {children}
            </pre>
          ),
          // 구분선 스타일링
          hr: () => (
            <hr className="border-border my-4" />
          ),
          // 인용문 스타일링
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}