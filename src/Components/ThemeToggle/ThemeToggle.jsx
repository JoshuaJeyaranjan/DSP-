import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.scss';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const label =
    theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      type="button"
    >
      <img
        src="/photoAssets/toggle-light.svg"
        alt={label}
        className={`theme-toggle__icon ${theme === 'dark' ? 'dark' : ''}`}
      />
    </button>
  );
}

export default ThemeToggle;