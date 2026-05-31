import katex from 'katex';
import 'katex/dist/katex.min.css';

export const renderLatex = (text: string | null | undefined): string => {
  if (!text) return '';
  
  let result = text;
  
  // Replace block math $$ ... $$
  result = result.replace(/\$\$(.*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  
  // Replace inline math $ ... $
  result = result.replace(/\$(.*?)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  
  return result;
};
