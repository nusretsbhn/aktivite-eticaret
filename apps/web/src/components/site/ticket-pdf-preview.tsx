'use client';

import { useEffect, useState } from 'react';

/**
 * PDF’i fetch + blob URL ile gösterir (doğrudan API URL’sine iframe vermek bazı tarayıcılarda boş kalır).
 */
export function TicketPdfPreview({ apiUrl }: { apiUrl: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      try {
        const res = await fetch(apiUrl, { credentials: 'include', cache: 'no-store' });
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          const j = (await res.json()) as { error?: string; detail?: string };
          if (!cancelled) {
            const msg = j.error ?? `Hata (${res.status})`;
            setError(j.detail ? `${msg} (${j.detail})` : msg);
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError(`Bilet alınamadı (${res.status})`);
          return;
        }
        const blob = await res.blob();
        if (blob.size === 0) {
          if (!cancelled) setError('Boş PDF yanıtı');
          return;
        }
        const url = URL.createObjectURL(blob);
        revoked = url;
        if (!cancelled) {
          setBlobUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Yükleme hatası');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Bilet yükleniyor…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }
  if (!blobUrl) {
    return null;
  }

  return (
    <div className="min-h-0 w-full flex-1">
      <iframe
        title="Bilet PDF"
        className="h-[min(70vh,800px)] w-full rounded-xl border border-zinc-200 bg-white shadow-inner dark:border-zinc-600 dark:bg-zinc-100"
        src={blobUrl}
      />
    </div>
  );
}
