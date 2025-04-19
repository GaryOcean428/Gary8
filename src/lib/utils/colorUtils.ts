/**
 * Gets a random color from predefined palettes based on the theme.
 * @param _theme - The current theme ('light' or 'dark').
 * @returns A random color hex string.
 */
export function getRandomColor(_theme: 'light' | 'dark'): string {
  const lightPalette = [
    '#3B82F6', // blue-500
    '#EC4899', // pink-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
  ];
  const darkPalette = [
    '#60A5FA', // blue-400
    '#F472B6', // pink-400
    '#34D399', // emerald-400
    '#FBBF24', // amber-400
    '#A78BFA', // violet-400
    '#22D3EE', // cyan-400
  ];

  const palette = _theme === 'light' ? lightPalette : darkPalette;
  const randomIndex = Math.floor(Math.random() * palette.length);
  return palette[randomIndex];
}
