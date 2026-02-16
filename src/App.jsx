import { useEffect, useMemo, useRef, useState } from 'react';

function readQueryGasUrl() {
  const qs = new URLSearchParams(window.location.search);
  return String(qs.get('gasUrl') || '').trim();
}

async function readEnvGasUrl() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json();
    return String(data.gasUrl || '').trim();
  } catch (_e) {
    return '';
  }
}

export default function App() {
  const [gasUrl, setGasUrl] = useState('');
  const [frameUrl, setFrameUrl] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [showManual, setShowManual] = useState(true);
  const readyRef = useRef(false);
  const frameLoadedRef = useRef(false);
  const timerRef = useRef(null);
  const sourceLabelRef = useRef('');

  const hasFrame = useMemo(() => Boolean(frameUrl), [frameUrl]);

  const armHealthCheck = (url) => {
    readyRef.current = false;
    frameLoadedRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (readyRef.current || frameLoadedRef.current) return;
      setStatus('Embed did not load. Check GAS URL/public access settings.');
    }, 8000);
    setStatus('Loading embedded app...');
    setFrameUrl(url);
  };

  const onLoadClick = () => {
    const url = gasUrl.trim();
    if (!url) return;
    localStorage.setItem('gas_embed_url', url);
    sourceLabelRef.current = 'manual';
    armHealthCheck(url);
  };

  useEffect(() => {
    const onMessage = (ev) => {
      if (!ev?.data || ev.data.type !== 'gas-app-ready') return;
      readyRef.current = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setStatus('Embedded app is ready.');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    (async () => {
      const queryUrl = readQueryGasUrl();
      const envUrl = await readEnvGasUrl();
      const savedUrl = String(localStorage.getItem('gas_embed_url') || '').trim();
      const initialUrl = queryUrl || envUrl || savedUrl;

      if (queryUrl) sourceLabelRef.current = 'query parameter';
      else if (envUrl) sourceLabelRef.current = 'Vercel env GAS_WEBAPP_URL';
      else if (savedUrl) sourceLabelRef.current = 'local storage';

      setShowManual(!(queryUrl || envUrl));
      setGasUrl(initialUrl);

      if (!initialUrl) {
        setStatus('GAS URL is not configured. Set GAS_WEBAPP_URL in Vercel or enter URL.');
        return;
      }
      armHealthCheck(initialUrl);
    })();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="page">
      <header>
        {showManual && (
          <div className="row">
            <input
              type="url"
              placeholder="Enter GAS Web App URL"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLoadClick()}
            />
            <button type="button" onClick={onLoadClick}>Load</button>
          </div>
        )}
        <div className="note">{status}</div>
        {!showManual && sourceLabelRef.current && (
          <div className="note">Source: {sourceLabelRef.current}</div>
        )}
        {hasFrame && (
          <div className="note">
            If embed fails, open directly:{' '}
            <a href={frameUrl} target="_blank" rel="noreferrer">Open directly</a>
          </div>
        )}
      </header>
      <main>
        <iframe
          title="GAS App"
          src={frameUrl}
          onLoad={() => {
            frameLoadedRef.current = true;
            if (timerRef.current) window.clearTimeout(timerRef.current);
            if (!readyRef.current) setStatus('Embedded frame loaded.');
          }}
        />
      </main>
    </div>
  );
}
