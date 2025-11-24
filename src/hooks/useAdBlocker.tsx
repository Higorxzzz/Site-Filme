import { useEffect } from 'react';

const blockedDomains = [
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'advertising.com',
  'popup.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'adsterra.com',
  'exoclick.com',
  'clickadu.com',
  'hilltopads.net',
  'trafficjunky.com',
  'trafficstars.com',
  'ero-advertising.com',
  'juicyads.com',
  'plugrush.com',
  'ads.php',
  'ad.php',
  'banner.php',
  'click.php',
  'popup.php',
  'otieu.com',
  'www.otieu.com',
];

export const useAdBlocker = () => {
  useEffect(() => {
    // Store original window.open
    const originalOpen = window.open;
    
    // Override window.open to block popups
    window.open = function(...args: any[]) {
      const url = args[0]?.toString() || '';
      
      // Check if URL contains blocked domains
      const isBlocked = blockedDomains.some(domain => url.includes(domain));
      
      if (isBlocked) {
        console.log('🚫 Popup bloqueado:', url);
        return null;
      }
      
      // Allow legitimate opens
      return originalOpen.apply(window, args);
    };

    // Block beforeunload popups
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // Intercept clicks to prevent redirects
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const isBlocked = blockedDomains.some(domain => 
          link.href.includes(domain)
        );
        
        if (isBlocked) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Redirecionamento bloqueado:', link.href);
        }
      }
    };

    // Add event listeners
    document.addEventListener('click', handleClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.open = originalOpen;
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};
