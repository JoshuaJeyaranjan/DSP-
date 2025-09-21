import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.scss'



function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  // SVG files placed in /public/photoAssets/
  const iconSrc = theme === 'light'
    ? '/photoAssets/toggle-light.svg'   // show "dark" icon while theme is light (indicates action)
    : '/photoAssets/toggle-dark.svg'; // show "light" icon while theme is dark

  const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      type="button"
    >
      <img src={iconSrc} alt={label} className="theme-toggle__icon" />
    </button>
  );
}

export default ThemeToggle;
