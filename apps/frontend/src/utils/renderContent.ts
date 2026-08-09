import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.js';

/**
 * Render a single LaTeX expression to HTML via KaTeX.
 */
const renderKaTeX = (latex: string, displayMode = false): string => {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false });
  } catch {
    return latex;
  }
};

/**
 * Replace Quill formula embeds (<span class="ql-formula" data-value="...">) with
 * freshly rendered KaTeX. Uses a real DOM element to reliably parse nested HTML.
 */
const replaceQlFormulas = (html: string): string => {
  if (!html || !html.includes('ql-formula')) return html;

  const div = document.createElement('div');
  div.innerHTML = html;

  const formulaSpans = div.querySelectorAll('span.ql-formula[data-value]');
  if (formulaSpans.length === 0) return html;

  formulaSpans.forEach(span => {
    const rawValue = span.getAttribute('data-value') || '';
    const latex = rawValue.includes('%') ? decodeURIComponent(rawValue) : rawValue;
    const rendered = renderKaTeX(latex, false);
    const wrapper = document.createElement('span');
    wrapper.innerHTML = rendered;
    span.parentNode?.replaceChild(wrapper, span);
  });

  return div.innerHTML;
};

/**
 * Universal content renderer that handles:
 * 1. Quill formula embeds: <span class="ql-formula" data-value="LATEX">…</span>
 * 2. Block LaTeX: $$...$$
 * 3. Inline LaTeX: $...$
 * 4. Basic Markdown-like formatting (bold, italic, headings, lists, code)
 */
export const renderContent = (raw: string): string => {
  if (!raw) return '<p>Belum ada konten.</p>';

  let result = replaceQlFormulas(raw);

  // Block LaTeX $$...$$ → centered display math
  result = result.replace(
    /\$\$([^$]+)\$\$/g,
    (_, l) => `<div class="my-6 py-4 flex justify-center overflow-x-auto">${renderKaTeX(l, true)}</div>`
  );
  // Inline LaTeX $...$ → inline math
  result = result.replace(/\$([^$\n]+)\$/g, (_, l) => renderKaTeX(l, false));
  // Markdown-ish formatting
  result = result
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-on-surface dark:text-zinc-100">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black font-manrope mt-8 mb-3 text-on-surface dark:text-zinc-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black font-manrope mt-10 mb-4 text-on-surface dark:text-zinc-100">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black font-manrope mt-12 mb-5 text-on-surface dark:text-zinc-100">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal leading-relaxed">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-low dark:bg-zinc-800 px-2 py-0.5 rounded-md text-sm font-mono text-primary">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-5 leading-loose">');

  return result;
};

/**
 * Lightweight renderer for Quill HTML – only handles formula embeds and LaTeX.
 * Use for question/option previews where full markdown parsing isn't needed.
 */
export const renderQuillHtml = (html: string): string => {
  if (!html) return '';

  let result = replaceQlFormulas(html);

  result = result.replace(
    /\$\$([^$]+)\$\$/g,
    (_, l) => `<div class="my-3 flex justify-center overflow-x-auto">${renderKaTeX(l, true)}</div>`
  );
  result = result.replace(/\$([^$\n]+)\$/g, (_, l) => renderKaTeX(l, false));

  return result;
};
