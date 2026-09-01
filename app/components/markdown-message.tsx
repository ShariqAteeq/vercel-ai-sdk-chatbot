import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mb-3 mt-5 text-xl font-semibold tracking-[-0.02em] text-[#23382d] first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2.5 mt-5 text-lg font-semibold tracking-[-0.015em] text-[#23382d] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-[#294536] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-3 leading-7 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#20372b]">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-[#6d9279]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-[#64816e]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-3 border-[#9db7a5] bg-white/70 py-2 pl-4 pr-3 text-[#526359]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-[#dbe5de]" />,
  a: ({ children, href }) => (
    <a
      className="font-medium text-[#326247] underline decoration-[#94b39e] underline-offset-3 transition hover:text-[#1f4932]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={`rounded-md bg-[#e7eee9] px-1.5 py-0.5 font-mono text-[0.86em] text-[#294735] ${className ?? ""}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-[#d9e2dc] bg-[#1f2e26] p-4 font-mono text-[0.82rem] leading-6 text-[#edf5ef] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <table className="my-4 block w-full overflow-x-auto text-left text-sm">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-[#d8e2db] bg-[#eaf0ec] px-3 py-2 font-semibold text-[#294536]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#d8e2db] px-3 py-2 align-top">
      {children}
    </td>
  ),
};

export function MarkdownMessage({ children }: { children: string }) {
  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {children}
    </ReactMarkdown>
  );
}
