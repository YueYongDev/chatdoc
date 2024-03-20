import React, {useEffect, useRef} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// 引入 rehype-highlight 的样式，你可以选择不同的主题
import 'highlight.js/styles/github.css';
import PageSpin from "../pageSpin";

export default function MarkdownViewer({markdown, loading}: { markdown: string; loading: boolean }) {
    const htmlRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (htmlRef.current) {
            htmlRef.current.scrollTop = 0;
        }
    }, [markdown]);

    return (
      <div
        ref={htmlRef}
        className="markdown-body h-full rounded-lg overflow-auto relative w-[700px] shadow-md"
      >
        {loading ? <PageSpin /> : <ReactMarkdown
            children={markdown}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
        />}
      </div>
    );
}
