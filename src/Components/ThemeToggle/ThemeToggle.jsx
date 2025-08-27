import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.scss'


function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className='theme-toggle' onClick={toggleTheme}>
      {theme === 'light' ? '🌙 ' : '☀️ '}
    </button>
  );
}

export default ThemeToggle;