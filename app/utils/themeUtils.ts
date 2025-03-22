/**
 * Theme utility functions for handling theme and font size preferences
 */

// Initialize theme from localStorage or system preference
export const initializeTheme = () => {
  if (typeof window === 'undefined') return;

  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // If no saved preference or set to 'system', use system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
    
    // Set up listener for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    });
  }

  // Initialize font size
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize) {
    document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`);
  }
};

// Toggle between light and dark themes
export const toggleTheme = () => {
  if (typeof window === 'undefined') return;

  const isDark = document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', !isDark);
  localStorage.setItem('theme', !isDark ? 'dark' : 'light');
};

// Set specific theme
export const setTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('theme', theme);

  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
};

// Set font size
export const setFontSize = (size: number) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('fontSize', size.toString());
  document.documentElement.style.setProperty('--base-font-size', `${size}px`);
};
