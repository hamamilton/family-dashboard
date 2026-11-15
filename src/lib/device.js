/**
 * Detects whether the current client is running on an Apple platform (iOS, iPadOS, macOS).
 * Returns false on Windows, Android, Linux, ChromeOS, etc.
 */
export function isAppleDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  // Explicit check for non-Apple platforms
  if (/Android/i.test(ua) || /Windows|Win32|Win64/i.test(ua) || /Windows Phone/i.test(ua) || /CrOS/i.test(ua)) {
    return false;
  }

  // iOS devices (iPhone, iPod)
  if (/iPhone|iPod/i.test(ua)) {
    return true;
  }

  // iPad (legacy UA or iPadOS desktop mode where platform is MacIntel but touch points > 1)
  if (/iPad/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return true;
  }

  // macOS Desktop (Macintosh / Intel / Apple Silicon)
  if (/Macintosh|Mac OS X|MacPPC|MacIntel/i.test(ua) || /Mac/i.test(platform)) {
    return true;
  }

  return false;
}
