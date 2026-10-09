'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <><h1>Journal temporarily unavailable</h1><p>Please try again later.</p><button onClick={reset}>Try again</button></>;
}
