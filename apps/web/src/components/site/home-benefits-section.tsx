import { BadgeCheck, LockKeyhole, MessageCircleMore, Search } from 'lucide-react';

const BENEFITS = [
  {
    id: 'secure-payment',
    title: 'Güvenli Ödeme',
    description: 'SSL sertifikalı güvenli ödeme altyapısı ile %100 güvenli işlemler',
    icon: LockKeyhole,
  },
  {
    id: 'quality-service',
    title: 'Kaliteli Hizmet',
    description: 'Deneyimli mürettebat ve kaliteli teknelerle unutulmaz deneyim',
    icon: BadgeCheck,
  },
  {
    id: 'support',
    title: '7/24 Destek',
    description: 'Uzman müşteri hizmetleri ekibimiz her zaman yanınızda',
    icon: MessageCircleMore,
  },
  {
    id: 'easy-booking',
    title: 'Kolay Rezervasyon',
    description: 'Sadece birkaç tıkla hızlı ve kolay rezervasyon yapın',
    icon: Search,
  },
];

export function HomeBenefitsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5"
              >
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

