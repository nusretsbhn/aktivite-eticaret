import { Suspense } from 'react';

import { RegisterFormClient } from '@/app/kayit/register-form-client';

export default function KayitPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-100">Yükleniyor…</div>}>
      <RegisterFormClient />
    </Suspense>
  );
}
