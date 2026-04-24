const EVENT = "rihla:open";

export type OpenChatDetail = {
  seedMessage?: string;
  autoSend?: boolean;
  voice?: boolean;
};

export function openRihlaChat(detail: OpenChatDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(EVENT, { detail }));
}

export function onRihlaOpen(handler: (detail: OpenChatDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<OpenChatDetail>).detail ?? {};
    handler(detail);
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
