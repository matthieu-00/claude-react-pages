import { Page } from '@playwright/test';

const AUTH_STORAGE_KEY = 'pst-auth-token';

/**
 * Generate an auth token for a given access level ID
 * This mimics the token generation in AuthContext
 */
function generateAuthToken(accessLevelId: string): string {
  const timestamp = Date.now();
  return btoa(`${accessLevelId}:${timestamp}`).replace(/=/g, '');
}

/**
 * Set authentication state directly via localStorage
 * This bypasses PIN entry for faster, more reliable tests
 */
export async function loginWithAccessLevel(page: Page, levelId: 'level1' | 'level2' | 'level3'): Promise<void> {
  await page.evaluate(
    ({ key, token }) => {
      localStorage.setItem(key, token);
    },
    { key: AUTH_STORAGE_KEY, token: generateAuthToken(levelId) }
  );
  // Wait for auth check to complete
  await waitForAuthCheck(page);
}

/**
 * Clear authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, AUTH_STORAGE_KEY);
  // Wait a bit for state to update
  await page.waitForTimeout(100);
}

/**
 * Wait for auth loading to complete
 * The app shows nothing while isLoading is true, so we wait for content to appear
 */
export async function waitForAuthCheck(page: Page): Promise<void> {
  // Wait for either the PIN modal (not authenticated) or navigation (authenticated)
  await Promise.race([
    page.waitForSelector('nav', { state: 'visible' }).catch(() => null),
    page.waitForSelector('[data-testid="pin-modal"]', { state: 'visible' }).catch(() => null),
  ]);
  // Give a small buffer for state updates
  await page.waitForTimeout(100);
}

/**
 * Login with a PIN (actual PIN entry flow)
 * Note: This requires knowing the actual PIN values
 * For most tests, use loginWithAccessLevel instead
 */
export async function loginWithPin(page: Page, pin: string): Promise<boolean> {
  const pinInput = page.getByTestId('pin-input');
  const submitButton = page.getByTestId('pin-submit');
  
  await pinInput.fill(pin);
  await submitButton.click();
  
  // Wait for either success (modal closes) or error
  try {
    await pinInput.waitFor({ state: 'hidden', timeout: 2000 });
    await waitForAuthCheck(page);
    return true;
  } catch {
    // Error message should appear
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate((key) => {
    return !!localStorage.getItem(key);
  }, AUTH_STORAGE_KEY);
}

/**
 * Get current access level from localStorage
 */
export async function getCurrentAccessLevel(page: Page): Promise<string | null> {
  return await page.evaluate((key) => {
    const token = localStorage.getItem(key);
    if (!token) return null;
    try {
      const decoded = atob(token);
      const [accessLevelId] = decoded.split(':');
      return accessLevelId;
    } catch {
      return null;
    }
  }, AUTH_STORAGE_KEY);
}
