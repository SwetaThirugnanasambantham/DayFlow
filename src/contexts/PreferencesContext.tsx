import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences, AestheticThemeId, BackgroundPattern, TypographyStyle } from '../types';
import { preferencesService, DEFAULT_PREFERENCES } from '../services/preferencesService';
import { useAuth } from './AuthContext';
import { THEMES } from '../constants/themes';

interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  toggleTheme: () => void;
  setAestheticTheme: (themeId: AestheticThemeId) => Promise<void>;
  setBackgroundPattern: (pattern: BackgroundPattern) => Promise<void>;
  setTypographyStyle: (style: TypographyStyle) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  useEffect(() => {
    let isMounted = true;
    preferencesService
      .getPreferences(effectiveUid)
      .then((prefs) => {
        if (isMounted) {
          setPreferences(prefs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveUid]);

  // Synchronize CSS attributes on <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const isDark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Set theme data attributes
    const aesthetic = preferences.aestheticTheme || 'default';
    const pattern = preferences.backgroundPattern || 'subtle-grid';
    const typo = preferences.typographyStyle || 'sans';
    const density = preferences.density || 'comfortable';

    root.setAttribute('data-aesthetic', aesthetic);
    root.setAttribute('data-pattern', pattern);
    root.setAttribute('data-typography', typo);
    root.setAttribute('data-density', density);
    root.setAttribute('data-accent', preferences.accentColor || 'indigo');

    // Also update meta theme-color to match theme primary
    const currentThemeConfig = THEMES[aesthetic] || THEMES.default;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDark ? currentThemeConfig.dark.bg : currentThemeConfig.light.bg
      );
    }
  }, [preferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const next = { ...preferences, ...updates };
    setPreferences(next);
    await preferencesService.savePreferences(effectiveUid, next);
  };

  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
  };

  const setAestheticTheme = async (themeId: AestheticThemeId) => {
    const themeConfig = THEMES[themeId];
    await updatePreferences({
      aestheticTheme: themeId,
      backgroundPattern: themeConfig ? themeConfig.recommendedPattern : preferences.backgroundPattern,
    });
  };

  const setBackgroundPattern = async (pattern: BackgroundPattern) => {
    await updatePreferences({ backgroundPattern: pattern });
  };

  const setTypographyStyle = async (style: TypographyStyle) => {
    await updatePreferences({ typographyStyle: style });
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
        toggleTheme,
        setAestheticTheme,
        setBackgroundPattern,
        setTypographyStyle,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
