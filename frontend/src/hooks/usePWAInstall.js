// Global install prompt handler
let deferredPromptGlobal = null;
let installHandlerAdded = false;
let isInstallableState = false;

export const initPWAInstall = (setIsInstallable) => {
  if (installHandlerAdded) return;
  
  const handler = (e) => {
    e.preventDefault();
    deferredPromptGlobal = e;
    isInstallableState = true;
    if (setIsInstallable) {
      setIsInstallable(true);
    }
  };
  
  window.addEventListener('beforeinstallprompt', handler);
  
  // Also listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    deferredPromptGlobal = null;
    isInstallableState = false;
  });
  
  installHandlerAdded = true;
};

export const getDeferredPrompt = () => deferredPromptGlobal;

export const setDeferredPrompt = (prompt) => {
  deferredPromptGlobal = prompt;
};

export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches;
};

// Check if PWA is currently installable
export const canInstallPWA = () => {
  return isInstallableState && deferredPromptGlobal !== null;
};
