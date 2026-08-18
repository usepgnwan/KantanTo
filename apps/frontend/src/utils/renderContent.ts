import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.js';

/**
 * Decode HTML entities and URI encoding commonly found in LaTeX formulas.
 */
export const decodeLatex = (latex: string): string => {
  if (!latex) return '';
  let decoded = latex
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  if (decoded.includes('%')) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // ignore URI decode error
    }
  }
  return decoded;
};

/**
 * Render a single LaTeX expression to HTML via KaTeX.
 */
export const renderKaTeX = (latex: string, displayMode = false): string => {
  try {
    const decoded = decodeLatex(latex);
    return katex.renderToString(decoded, { displayMode, throwOnError: false });
  } catch {
    return latex;
  }
};

/**
 * Replace Quill formula embeds (<span class="ql-formula" data-value="...">) with
 * freshly rendered KaTeX. Uses a real DOM element when available for reliable parsing,
 * with robust regex fallbacks.
 */
export const replaceQlFormulas = (html: string): string => {
  if (!html || !html.includes('ql-formula')) return html;

  if (typeof document !== 'undefined') {
    try {
      const div = document.createElement('div');
      div.innerHTML = html;
      const formulaSpans = div.querySelectorAll('span.ql-formula, span[data-value].ql-formula');
      if (formulaSpans.length > 0) {
        formulaSpans.forEach(span => {
          const rawValue = span.getAttribute('data-value') || '';
          const decoded = decodeLatex(rawValue);
          const rendered = renderKaTeX(decoded, false);
          const wrapper = document.createElement('span');
          wrapper.className = 'katex-formula-wrapper inline-block';
          wrapper.innerHTML = rendered;
          span.parentNode?.replaceChild(wrapper, span);
        });
        return div.innerHTML;
      }
    } catch {
      // fallback to regex if DOM parsing fails
    }
  }

  // Regex fallback for non-DOM or fallback situations:
  let result = html;
  result = result.replace(
    /<span[^>]*class=["'][^"']*ql-formula[^"']*["'][^>]*data-value=["']([\s\S]*?)["'][^>]*>[\s\S]*?<\/span>/gi,
    (_, latex) => renderKaTeX(latex, false)
  );
  result = result.replace(
    /<span[^>]*data-value=["']([\s\S]*?)["'][^>]*class=["'][^"']*ql-formula[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
    (_, latex) => renderKaTeX(latex, false)
  );

  return result;
};

/**
 * Process all LaTeX in text or HTML:
 * 1. Quill formula spans
 * 2. Block LaTeX $$...$$
 * 3. Inline LaTeX $...$
 */
export const processLatex = (content: string): string => {
  if (!content) return '';

  let result = replaceQlFormulas(content);

  // Block LaTeX $$...$$ → centered display math (supports multiline)
  result = result.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_, l) => `<div class="my-4 sm:my-6 flex justify-center overflow-x-auto">${renderKaTeX(l, true)}</div>`
  );

  // Inline LaTeX $...$ → inline math
  result = result.replace(/\$([^$\n]+?)\$/g, (_, l) => renderKaTeX(l, false));

  return result;
};

/**
 * Check if the input string contains HTML tags.
 */
const isHtml = (str: string): boolean => {
  return /<\/?(?:p|h[1-6]|ul|ol|li|div|table|tr|td|th|blockquote|span|strong|em|b|i|br|a|img)[>\s/]/i.test(str);
};

/**
 * Universal content renderer that handles:
 * 1. Quill HTML content & formula embeds
 * 2. Block LaTeX: $$...$$
 * 3. Inline LaTeX: $...$
 * 4. Markdown formatting (headings, lists, bold, italics, code, paragraphs)
 */
export const renderContent = (raw: string): string => {
  if (!raw) return '<p>Belum ada konten.</p>';

  const withMath = processLatex(raw);

  // If the content is already HTML from Quill, return it with math processed
  if (isHtml(raw)) {
    return withMath;
  }

  // Otherwise, apply Markdown parsing
  let result = withMath
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-on-surface dark:text-zinc-100">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black font-manrope mt-8 mb-3 text-on-surface dark:text-zinc-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black font-manrope mt-10 mb-4 text-on-surface dark:text-zinc-100">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black font-manrope mt-12 mb-5 text-on-surface dark:text-zinc-100">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal leading-relaxed">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-low dark:bg-zinc-800 px-2 py-0.5 rounded-md text-sm font-mono text-primary">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-5 leading-loose">');

  return `<p class="mb-5 leading-loose">${result}</p>`;
};

/**
 * Lightweight renderer for Quill HTML – only handles formula embeds and LaTeX.
 * Use for question/option previews where full markdown parsing isn't needed.
 */
export const renderQuillHtml = (html: string): string => {
  if (!html) return '';
  return processLatex(html);
};
