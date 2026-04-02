'use client';

import {
  DICTIONARY_ICON_MAP,
  LUCIDE_ICON_PICKER_OPTIONS,
  type DictionaryIconKey,
} from '@/components/icons/dictionary-icon';

type Props = {
  /** Lucide bileşen adı (örn. Utensils) */
  value: DictionaryIconKey | string;
  onChange: (next: DictionaryIconKey) => void;
};

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">İkon</p>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950/50">
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {LUCIDE_ICON_PICKER_OPTIONS.map(({ key, hint }) => {
            const Icon = DICTIONARY_ICON_MAP[key];
            const selected = value === key;
            return (
              <button
                key={key}
                type="button"
                title={`${key} — ${hint}`}
                onClick={() => onChange(key)}
                className={`flex h-10 w-10 items-center justify-center rounded-md transition ${
                  selected
                    ? 'bg-zinc-900 text-white ring-2 ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Profesyonel çizgi ikonlar (Lucide). Üzerine gelerek ipucu görün.
      </p>
    </div>
  );
}
