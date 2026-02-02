import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, _theme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      // Apply theme immediately on initialization
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(savedTheme);
      return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Also set it on the html element's class attribute directly
    root.setAttribute('class', theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Debug log
    console.log('Theme changed to:', theme, 'HTML classes:', root.className);
  }, [theme]);

  const toggleTheme = () => {
    _theme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      // Apply immediately for instant feedback
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      root.setAttribute('class', newTheme);
      console.log('Toggling from', prev, 'to', newTheme, 'Applied class:', root.className);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
