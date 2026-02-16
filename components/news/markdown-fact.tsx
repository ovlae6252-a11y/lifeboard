"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownFactProps {
  content: string;
}

/**
 * 팩트 아이템을 마크다운으로 렌더링하는 Client Component.
 * 인라인 마크다운(굵은 글씨, 기울임, 링크 등)을 지원.
 */
export function MarkdownFact({ content }: MarkdownFactProps) {
  return (
    <div className="text-foreground flex-1 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 인라인 요소만 허용 (p 태그는 제거)
          p: ({ children }) => <span>{children}</span>,
          // 굵은 글씨
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">
              {children}
            </strong>
          ),
          // 기울임
          em: ({ children }) => <em className="italic">{children}</em>,
          // 인라인 코드
          code: ({ children }) => (
            <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          // 링크
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
