export const WHISPER_SHOPPING_PROMPT =
  'Indian shopping assistant. Catalog words: kurta, kurtas, kurti, palazzo, chinos, joggers, stole, makhana, vegan snacks, green tea, oversized tee. Example: kurta under 500 rupees.';

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bkirtans\b/gi, 'kurtas'],
  [/\bkirtan\b/gi, 'kurta'],
  [/\bkirtens\b/gi, 'kurtas'],
  [/\bkirten\b/gi, 'kurta'],
  [/\bkhurtas\b/gi, 'kurtas'],
  [/\bkhurta\b/gi, 'kurta'],
  [/\bkurtah\b/gi, 'kurta'],
  [/\bcurtains\b/gi, 'kurtas'],
  [/\bcurtain\b/gi, 'kurta'],
  [/\bmakana\b/gi, 'makhana'],
  [/\bmakhanas\b/gi, 'makhana'],
];

export function correctShoppingTranscript(text: string): string {
  return REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text
  ).replace(/\s+/g, ' ').trim();
}
