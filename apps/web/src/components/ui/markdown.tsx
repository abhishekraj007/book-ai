import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-bold mb-5 mt-7 text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-semibold mb-4 mt-6 text-foreground">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xl font-semibold mb-3 mt-5 text-foreground">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-lg font-semibold mb-2 mt-4 text-foreground">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-base font-semibold mb-2 mt-3 text-foreground">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-foreground/90">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground/90">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground/90">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 text-foreground/90">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ inline, children, ...props }: any) =>
          inline ? (
            <code
              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 text-foreground"
              {...props}
            >
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
            {children}
          </pre>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground">{children}</em>
        ),
        hr: () => <hr className="my-8 border-border" />,
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-border">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-foreground/90">{children}</td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  );
}
