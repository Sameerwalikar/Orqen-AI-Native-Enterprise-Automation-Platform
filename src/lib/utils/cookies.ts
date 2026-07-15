import Cookies from 'js-cookie';

export const COOKIE_NAMES = {
  CONSENT: 'cookie_consent',
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference',
  REMEMBER_EMAIL: 'remember_email'
} as const;

export interface CookieConsent {
  accepted: boolean;
  timestamp: number;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
}

class CookieService {
  private readonly defaultOptions = {
    sameSite: 'strict' as const,
    secure: window.location.protocol === 'https:',
    path: '/'
  };

  set(name: string, value: string, days?: number): void {
    const options: Cookies.CookieAttributes = {
      ...this.defaultOptions,
      expires: days ? days : undefined
    };
    Cookies.set(name, value, options);
  }

  get(name: string): string | undefined {
    return Cookies.get(name);
  }

  remove(name: string): void {
    Cookies.remove(name, { path: '/' });
  }

  hasConsent(): boolean {
    const consent = this.get(COOKIE_NAMES.CONSENT);
    if (!consent) return false;
    try {
      const parsed: CookieConsent = JSON.parse(consent);
      return parsed.accepted === true;
    } catch {
      return false;
    }
  }

  setConsent(accepted: boolean): void {
    const consent: CookieConsent = {
      accepted,
      timestamp: Date.now()
    };
    this.set(COOKIE_NAMES.CONSENT, JSON.stringify(consent), 365);
  }

  getTheme(): Preferences['theme'] {
    const theme = this.get(COOKIE_NAMES.THEME);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return 'system';
  }

  setTheme(theme: Preferences['theme']): void {
    this.set(COOKIE_NAMES.THEME, theme, 365);
  }

  getLanguage(): string {
    return this.get(COOKIE_NAMES.LANGUAGE) || 'en';
  }

  setLanguage(language: string): void {
    this.set(COOKIE_NAMES.LANGUAGE, language, 365);
  }

  getRememberEmail(): string | null {
    return this.get(COOKIE_NAMES.REMEMBER_EMAIL) || null;
  }

  setRememberEmail(email: string): void {
    this.set(COOKIE_NAMES.REMEMBER_EMAIL, email, 30);
  }

  clearRememberEmail(): void {
    this.remove(COOKIE_NAMES.REMEMBER_EMAIL);
  }

  getAllPreferences(): Preferences {
    return {
      theme: this.getTheme(),
      language: this.getLanguage()
    };
  }

  setPreferences(preferences: Partial<Preferences>): void {
    if (preferences.theme !== undefined) {
      this.setTheme(preferences.theme);
    }
    if (preferences.language !== undefined) {
      this.setLanguage(preferences.language);
    }
  }
}

export const cookieService = new CookieService();

