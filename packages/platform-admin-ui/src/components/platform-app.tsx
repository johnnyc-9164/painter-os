'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readPlatform, type PlatformResult, type PlatformSection } from '../client';
import { PlatformView } from './platform-view';

export function PlatformApp({ section, workspaceId, cursor, contractorHref }: { section: PlatformSection; workspaceId?: string; cursor?: string; contractorHref?: string | null }) {
  const router = useRouter();
  const [result, setResult] = useState<PlatformResult>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [signOutError, setSignOutError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    const url = section === 'activity' ? `/api/platform/activity${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}` : section === 'workspaces' ? `/api/platform/workspaces${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}` : section === 'detail' ? `/api/platform/workspaces/${encodeURIComponent(workspaceId ?? '')}` : '/api/platform/access';
    readPlatform(section, url, signal).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(() => { if (!controller.signal.aborted) setResult({ state: 'unavailable', reason: 'backend_unavailable' }); });
    return () => controller.abort();
  }, [section, workspaceId, cursor, attempt]);
  function retry() { setResult({ state: 'loading' }); setAttempt(value => value + 1); }
  async function signOut() {
    setSignOutError(''); setResult({ state: 'loading' });
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'logout' }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('SIGN_OUT_FAILED');
      setResult({ state: 'unauthenticated' });
      router.replace('/platform/login');
      router.refresh();
    } catch { setSignOutError('Sign out could not be completed. Retry when your connection is available.'); setResult({ state: 'unavailable', reason: 'backend_unavailable' }); }
  }
  return <PlatformView section={section} result={result} cursor={cursor} contractorHref={contractorHref} onRetry={retry} onSignOut={signOut} signOutError={signOutError}/>;
}
