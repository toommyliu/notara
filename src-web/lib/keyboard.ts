// Maps physical key codes to their corresponding key characters.
// Used for layout-insensitive matching where modifier keys can change the output character.
export const LAYOUT_INSENSITIVE_CODES: Record<string, string> = {
  BracketLeft: '[',
  BracketRight: ']',
  Backquote: '`',
  Semicolon: ';',
  Quote: '\'',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  Minus: '-',
  Equal: '=',
};

export function getKeyFromEvent(ev: KeyboardEvent): string {
  // Check layout-insensitive codes first
  const mappedKey = LAYOUT_INSENSITIVE_CODES[ev.code];
  if (mappedKey)
    return mappedKey;

  // Handle letter keys via code when Alt is pressed (macOS produces special chars)
  if (ev.altKey || ev.ctrlKey) {
    const letterMatch = ev.code.match(/^Key([A-Z])$/);
    if (letterMatch)
      return letterMatch[1].toLowerCase();

    const digitMatch = ev.code.match(/^Digit(\d)$/);
    if (digitMatch)
      return digitMatch[1];
  }

  return ev.key;
}
