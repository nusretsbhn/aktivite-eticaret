import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { Font } from '@react-pdf/renderer';

let notoRegisterOk: boolean | null = null;

/** Noto Sans (Türkçe) — `public/fonts/*.ttf` yoksa veya kayıt hata verirse Helvetica. */
export function registerTicketFonts(): 'NotoSans' | 'Helvetica' {
  if (notoRegisterOk === false) return 'Helvetica';
  if (notoRegisterOk === true) return 'NotoSans';

  const regular = join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf');
  const bold = join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf');
  if (!existsSync(regular)) {
    notoRegisterOk = false;
    return 'Helvetica';
  }
  try {
    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: regular, fontWeight: 400 },
        ...(existsSync(bold) ? [{ src: bold, fontWeight: 700 }] : []),
      ],
    });
    notoRegisterOk = true;
    return 'NotoSans';
  } catch (e) {
    console.warn('[ticket-pdf-fonts] NotoSans kaydı başarısız, Helvetica kullanılacak', e);
    notoRegisterOk = false;
    return 'Helvetica';
  }
}
