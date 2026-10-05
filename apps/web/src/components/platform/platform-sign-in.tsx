'use client';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@painter-os-bts/ui/components/button';
import { Input } from '@painter-os-bts/ui/components/input';
import { Label } from '@painter-os-bts/ui/components/label';
import { Eye, EyeOff } from 'lucide-react';

/** Existing same-origin Better Auth sign-in only; no signup, demo or tenant snapshot call. */
export function PlatformSignIn({ onSignedIn }: { onSignedIn(): void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) {
      setError('Enter your email address and password.');
      (!/^\S+@\S+\.\S+$/.test(email.trim()) ? emailRef : passwordRef).current?.focus();
      return;
    }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'login', email: email.trim(), password }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        setError(response.status >= 500 ? 'Sign in is temporarily unavailable. Try again.' : 'Unable to sign in. Check your email and password and try again.');
        setPassword(''); passwordRef.current?.focus(); return;
      }
      setPassword(''); onSignedIn();
    } catch { setPassword(''); setError('Sign in could not be reached. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <form noValidate onSubmit={submit} className="grid gap-5" aria-busy={busy}>
    <div className="grid gap-2"><Label htmlFor="platform-email">Email address</Label><Input ref={emailRef} id="platform-email" name="email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'platform-sign-in-error' : undefined}/></div>
    <div className="grid gap-2"><Label htmlFor="platform-password">Password</Label><div className="flex gap-2"><Input ref={passwordRef} id="platform-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'platform-sign-in-error' : undefined}/><Button type="button" variant="outline" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>}</Button></div></div>
    {error && <p id="platform-sign-in-error" role="alert">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to platform'}</Button>
  </form>;
}
