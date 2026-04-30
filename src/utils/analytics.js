export function trackEvent(eventName, props = {}) {
  const payload = {
    eventName,
    at: new Date().toISOString(),
    ...props,
  };
  if (import.meta.env.DEV) {
    console.info('[analytics]', payload);
  }
}

