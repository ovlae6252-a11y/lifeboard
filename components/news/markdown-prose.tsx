"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProseProps {
  content: string;
}

/**
 * 서술형 마크다운 전체를 렌더링하는 Client Component.
 * 문단(p), 제목(h2/h3), 목록(ul/li) 등 블록 요소를 지원한다.
 * 기존 불릿 포인트 데이터도 처리하여 하위 호환성을 유지한다.
 */
export function MarkdownProse({ content }: MarkdownProseProps) {
  return (
    <div className="text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 문단: 블록 요소로 렌더링
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
          ),
          // 굵은 글씨
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">
              {children}
            </strong>
          ),
          // 기울임
          em: ({ children }) => <em className="italic">{children}</em>,
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
          // 제목 (h2)
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 font-serif text-base font-semibold">
              {children}
            </h2>
          ),
          // 제목 (h3)
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1 text-sm font-semibold">{children}</h3>
          ),
          // 순서 없는 목록 (하위 호환: 불릿 데이터도 렌더링)
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-4">{children}</ul>
          ),
          // 목록 항목
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
