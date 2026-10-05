'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <><h1>The journal is temporarily unavailable.</h1><p>Please try again shortly.</p><button onClick={reset}>Try again</button></>;
}
