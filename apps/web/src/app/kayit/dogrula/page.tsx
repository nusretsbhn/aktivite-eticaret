import { Suspense } from 'react';

import { VerifyClient } from '@/app/kayit/dogrula/verify-client';

export default function KayitDogrulaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-100">Yükleniyor…</div>}>
      <VerifyClient />
    </Suspense>
  );
}
