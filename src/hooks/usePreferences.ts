import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cookieService, type Preferences } from '@/lib/utils/cookies';

export const usePreferences = () => {
  const { theme, setTheme: setThemeMode } = useTheme();
  const [language, setLanguageState] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      if (!cookieService.hasConsent()) {
        setIsLoading(false);
        return;
      }

      const prefs = cookieService.getAllPreferences();
      
      if (prefs.theme && prefs.theme !== theme) {
        setThemeMode(prefs.theme);
      }
      
      setLanguageState(prefs.language);
      setIsLoading(false);
    };

    loadPreferences();
  }, [theme, setThemeMode]);

  const updateTheme = (newTheme: Preferences['theme']) => {
    if (cookieService.hasConsent()) {
      cookieService.setTheme(newTheme);
      setThemeMode(newTheme);
    }
  };

  const updateLanguage = (newLanguage: string) => {
    if (cookieService.hasConsent()) {
      cookieService.setLanguage(newLanguage);
      setLanguageState(newLanguage);
    }
  };

  const updatePreferences = (prefs: Partial<Preferences>) => {
    if (cookieService.hasConsent()) {
      cookieService.setPreferences(prefs);
      if (prefs.theme) {
        setThemeMode(prefs.theme);
      }
      if (prefs.language) {
        setLanguageState(prefs.language);
      }
    }
  };

  return {
    theme: theme as Preferences['theme'],
    language,
    isLoading,
    updateTheme,
    updateLanguage,
    updatePreferences
  };
};

