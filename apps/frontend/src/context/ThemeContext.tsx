import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Ant Design Customization
  const primaryColor = '#0060ad';

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: primaryColor,
            borderRadius: 12,
            fontFamily: 'Inter, sans-serif',
            colorBgBase: mode === 'dark' ? '#09090b' : '#f8fafc',
            colorBgContainer: mode === 'dark' ? '#18181b' : '#ffffff',
            colorBorder: mode === 'dark' ? '#27272a' : '#e2e8f0',
          },
          components: {
            Button: {
              borderRadius: 12,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 600,
              controlHeight: 40,
            },
            Card: {
              borderRadius: 16,
              colorBorderSecondary: mode === 'dark' ? '#27272a' : '#e2e8f0',
            },
            Tabs: {
              fontFamily: 'Manrope, sans-serif',
              // fontWeight: 600,
            },
            Input: {
              borderRadius: 12,
            },
            Select: {
              borderRadius: 12,
            }
          }
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
