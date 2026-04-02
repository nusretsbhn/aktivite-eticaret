import { SiteAccountMenu } from '@/components/site/site-account-menu';
import { SiteNotificationBell } from '@/components/site/site-notification-bell';

type Variant = 'site' | 'hero-inverse';

export function SiteAccountWithNotifications({
  menuClassName,
  variant = 'site',
  bellButtonClassName,
}: {
  menuClassName: string;
  variant?: Variant;
  /** Hero’da `headerScrolled` ile değişen zil butonu sınıfları */
  bellButtonClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <SiteAccountMenu className={menuClassName} variant={variant} />
      <SiteNotificationBell buttonClassName={bellButtonClassName} />
    </div>
  );
}
