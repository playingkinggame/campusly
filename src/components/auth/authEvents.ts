/** Lets any form tell the login card to shake (for example after a wrong password). */
export const AUTH_SHAKE_EVENT = 'campusly:auth-shake';

export function shakeAuthCard(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_SHAKE_EVENT));
}
