// Test script for theme switching
// You can run these commands in your browser console to test theme switching

// Apply light theme
function applyLightTheme() {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
  console.log('Light theme applied');
}

// Apply dark theme
function applyDarkTheme() {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
  console.log('Dark theme applied');
}

// Apply system theme
function applySystemTheme() {
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', systemPrefersDark);
  localStorage.setItem('theme', 'system');
  console.log('System theme applied (currently ' + (systemPrefersDark ? 'dark' : 'light') + ')');
}

// Change font size
function changeFontSize(size) {
  document.documentElement.style.setProperty('--base-font-size', `${size}px`);
  localStorage.setItem('fontSize', size.toString());
  console.log(`Font size changed to ${size}px`);
}

// Print current theme settings
function getThemeSettings() {
  const isDark = document.documentElement.classList.contains('dark');
  const fontSize = localStorage.getItem('fontSize') || '16';
  const theme = localStorage.getItem('theme') || 'system';
  
  console.log('Current theme settings:');
  console.log(`- Theme: ${theme} (currently displaying as ${isDark ? 'dark' : 'light'})`);
  console.log(`- Font size: ${fontSize}px`);
}

// Example usage:
// applyLightTheme();
// applyDarkTheme();
// applySystemTheme();
// changeFontSize(18);
// getThemeSettings();
