import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { Order } from '@/types/order';

const RED = '#c41e3a';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  left: {
    width: '70%',
    padding: 20,
    paddingRight: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 88,
    height: 44,
    marginRight: 10,
    objectFit: 'contain',
  },
  brandVertical: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.5,
    width: 72,
    marginRight: 8,
    color: '#111',
  },
  routeBlock: {
    flex: 1,
  },
  routeCities: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
  },
  routeMain: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111',
    marginBottom: 3,
  },
  routeTimes: {
    fontSize: 10,
    color: '#333',
  },
  boardingPassLabel: {
    fontSize: 7,
    color: '#888',
    textAlign: 'right',
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  cell: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 6,
  },
  label: {
    fontSize: 6,
    color: RED,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 10,
    color: '#111',
    fontWeight: 700,
  },
  highlightRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bigLabel: {
    fontSize: 7,
    color: RED,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  bigValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
  },
  routeFooter: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: 700,
    color: '#222',
  },
  right: {
    width: '30%',
    backgroundColor: RED,
    padding: 12,
    justifyContent: 'flex-start',
  },
  stubQuote: {
    fontSize: 6,
    color: '#ffffff',
    lineHeight: 1.35,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  qr: {
    width: 110,
    height: 110,
  },
  orderNoStub: {
    fontSize: 7,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
});

function fmtDate(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' }).format(
    new Date(y, (m || 1) - 1, d || 1),
  );
}

function meetingParts(tripInfo?: string) {
  const raw = tripInfo?.trim() || '—';
  const first = raw.split('→')[0]?.trim() || raw;
  return { line: raw, first };
}

export function TicketPdfDocument({
  order,
  qrDataUrl,
  fromLabel,
  toLabel,
  fontFamily,
  logoSrc,
}: {
  order: Order;
  qrDataUrl: string;
  fromLabel: string;
  toLabel: string;
  fontFamily: string;
  logoSrc: string | null;
}) {
  const loc = order.location || order.departurePlace || 'Bodrum';
  const locLine = `${loc.toLocaleLowerCase('tr-TR')} → tekne turu`;
  const { line: seferLine, first: bulusma } = meetingParts(order.tripInfo);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={[styles.page, { fontFamily }]}>
        <View style={styles.left}>
          <View style={styles.brandRow}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={styles.brandVertical}>BODRUM{'\n'}AKTİVİTE</Text>
            )}
            <View style={styles.routeBlock}>
              <Text style={styles.routeCities}>{locLine}</Text>
              <Text style={styles.routeMain}>
                {fromLabel} → {toLabel}
              </Text>
              <Text style={styles.routeTimes}>{seferLine}</Text>
            </View>
            <View>
              <Text style={styles.boardingPassLabel}>YOLCU BİLETİ</Text>
              <Text style={{ fontSize: 9, fontWeight: 700, color: '#111' }}>BOARDING PASS</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.label}>Yolcu</Text>
              <Text style={styles.value}>{order.fullName}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Sipariş No</Text>
              <Text style={styles.value}>{order.orderNo}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Tur</Text>
              <Text style={styles.value}>{order.tourName}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Tarih</Text>
              <Text style={styles.value}>{fmtDate(order.date)}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Kalkış noktası</Text>
              <Text style={styles.value}>{order.departurePlace || '—'}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Kişi sayısı</Text>
              <Text style={styles.value}>{String(order.peopleCount)}</Text>
            </View>
          </View>

          <View style={styles.highlightRow}>
            <View>
              <Text style={styles.bigLabel}>Sefer bilgisi</Text>
              <Text style={{ fontSize: 14, fontWeight: 700 }}>{seferLine}</Text>
            </View>
            <View>
              <Text style={styles.bigLabel}>Buluşma</Text>
              <Text style={styles.bigValue}>{bulusma}</Text>
            </View>
          </View>
          <Text style={styles.routeFooter}>
            {loc.toLocaleUpperCase('tr-TR')} — {order.tourName}
          </Text>
        </View>

        <View style={[styles.right, { fontFamily }]}>
          <Text style={styles.stubQuote}>
            &quot;Biniş öncesinde personelimize QR kodu göstererek hızlıca geçiş yapabilirsiniz.&quot;
          </Text>
          <View style={styles.qrWrap}>
            <Image src={qrDataUrl} style={styles.qr} />
          </View>
          <Text style={styles.orderNoStub}>{order.orderNo}</Text>
        </View>
      </Page>
    </Document>
  );
}
