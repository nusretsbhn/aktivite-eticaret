'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import type { PublicUserBrief } from '@/components/site/site-auth-provider';

type Props = {
  open: boolean;
  onClose: () => void;
  user: PublicUserBrief | null;
  onLogin: () => void;
  onRegister: () => void;
  /** Giriş yapmadan talep — alt bağlantı */
  onRequestWithoutAccount: () => void;
};

export function VillaInstantBookingGateModal({
  open,
  onClose,
  user,
  onLogin,
  onRegister,
  onRequestWithoutAccount,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 text-zinc-900 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="villa-instant-gate-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>

        {user ? (
          <div className="pt-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <span className="text-3xl font-bold text-zinc-900">✓</span>
            </div>
            <h2 id="villa-instant-gate-title" className="text-lg font-bold text-zinc-900">
              Merhaba, {user.fullName.split(' ')[0] || user.fullName}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Anında rezervasyon ve ödeme adımı çok yakında burada olacak. Şimdilik rezervasyon talebi oluşturabilirsiniz.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Tamam
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center pt-2 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <span className="text-3xl font-bold leading-none text-zinc-900">i</span>
              </div>
              <h2 id="villa-instant-gate-title" className="text-lg font-bold leading-snug text-zinc-900 sm:text-xl">
                Anında rezervasyon oluşturmak için giriş yapın veya kaydolun
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Giriş yapmadan rezervasyon talebi oluşturabilirsiniz. Ekibimiz talebinizi inceleyerek sizinle iletişime
                geçer.
              </p>
            </div>

            <div className="my-6 border-t border-zinc-200" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogin();
                }}
                className="min-h-12 rounded-full border-2 border-teal-600 bg-white px-4 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegister();
                }}
                className="min-h-12 rounded-full bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Kayıt Ol
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestWithoutAccount();
              }}
              className="mt-5 w-full text-center text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              Rezervasyon Talebi Oluştur
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
