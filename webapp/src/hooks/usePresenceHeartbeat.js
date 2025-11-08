import { useEffect, useRef } from 'react';
import { presenceTouch } from '../api/chat';
import { useAuth } from '../auth/useAuth';

export default function usePresenceHeartbeat({
  intervalMs = 60000,           // kas 60 s
  fireImmediately = true,       // pirmą ping iškart
} = {}) {
  const { ready, user, token } = useAuth();
  const timerRef = useRef(null);

  // paprastas "leader tab" lock'as, kad nerodytų kelių pingų iš skirtingų tabų
  function isLeader() {
    const key = 'presence_leader';
    const now = Date.now();
    try {
      const raw = localStorage.getItem(key);
      const last = raw ? parseInt(raw, 10) : 0;
      // jei > 10s seniau – perimam lyderystę
      if (!last || now - last > 10000) {
        localStorage.setItem(key, String(now));
        return true;
      }
      return false;
    } catch {
      return true; // jei localStorage nepavyksta – nekliūnam
    }
  }

  useEffect(() => {
    const canPing = ready && user && token;

    function tick() {
      // tik kai tab'as matomas ir šis tab'as "lyderis"
      if (document.visibilityState === 'visible' && isLeader()) {
        presenceTouch().catch(() => {});
      }
    }

    function start() {
      if (!canPing || timerRef.current) return;
      if (fireImmediately) tick();
      timerRef.current = setInterval(tick, intervalMs);
    }

    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (canPing) {
      start();
      const onFocus = () => tick();
      const onVis = () => tick();
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVis);
      return () => {
        stop();
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVis);
      };
    } else {
      stop();
    }
  }, [ready, user, token, intervalMs, fireImmediately]);
}