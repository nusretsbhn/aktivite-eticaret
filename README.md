# Bodrum Aktivite E-Ticaret

Bu repo, `apps/api` (NestJS) ve `apps/web` (Next.js) içerir. Başlangıç planı `PROJE_PLANI.md` dokümanında tanımlı.

## Web (Next.js)

- `cd apps/web && npm install && npm run dev` → varsayılan `http://localhost:3000`
- **Admin panel:** `http://localhost:3000/admin` → giriş sonrası `/admin/dashboard`
- Ortam değişkenleri: `apps/web/.env.example` dosyasını `.env.local` olarak kopyalayın; `DATABASE_URL`, `ADMIN_PANEL_EMAIL`, `ADMIN_PANEL_PASSWORD`, `ADMIN_SESSION_SECRET` alanlarını doldurun (`ADMIN_SESSION_SECRET` için `openssl rand -hex 32` kullanabilirsiniz).
- PostgreSQL migration: `cd apps/web && npm run db:migrate`
- Sistem ilk çalıştırmada `app_json_store` tablosunu da otomatik oluşturur. Eski `data/*.json` kayıtları DB'de ilgili key yoksa ilk okumada otomatik içeri alınır.

## EasyPanel Canlıya Alma Notu

1. EasyPanel'de PostgreSQL servisini oluşturun.
2. Web servisine `DATABASE_URL` (ve gerekiyorsa `DATABASE_SSL=require`) tanımlayın.
3. Deploy sonrası bir kez `npm run db:migrate` çalıştırın.
4. Uygulama ayağa kalkınca tüm ayarlar/siparişler/aktiviteler/villa verileri PostgreSQL üstündeki `app_json_store` tablosundan okunur ve yazılır.
5. Medya dosyaları (upload edilen görseller, ticket PDF) dosya sistemi üstünde kalır; URL ve metaveriler veritabanında tutulur.

## Başlangıç

1. `apps/api` iskeletini NestJS ile oluştur.
2. `apps/web` iskeletini Next.js ile oluştur.
3. Ortak tipler için `packages/shared` kullan.

cd "/Users/nusret/Desktop/Aktivite-eticaret/bodrum-aktivite/apps/web"
unset MallocStackLogging MallocStackLoggingNoCompact MallocScribble MallocNanoZone
npm run dev -- --webpack