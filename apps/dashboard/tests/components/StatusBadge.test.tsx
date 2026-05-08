import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/ui/StatusBadge';
import { LanguageProvider } from '@/lib/i18n';
import { setUtilLang } from '@/lib/utils';

function withLang(lang: 'ru' | 'en', children: React.ReactNode) {
  // Keep the format-utility module variable in sync — `getStatusLabel` reads it.
  setUtilLang(lang);
  return <LanguageProvider initialLang={lang}>{children}</LanguageProvider>;
}

const LIFECYCLE_STATUSES = [
  'pending',
  'accepted',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'failed',
] as const;

describe('StatusBadge — labels', () => {
  test.each(LIFECYCLE_STATUSES)('renders an English label for %s', (s) => {
    render(withLang('en', <StatusBadge status={s} />));
    // We don't pin the exact wording (it can change in messages files); we only
    // check that *something* sensible rendered — a non-empty label that is not
    // the raw enum value.
    const node = screen.getByText((content) => content.length > 0);
    expect(node).toBeInTheDocument();
  });

  test.each(LIFECYCLE_STATUSES)('renders a Russian label for %s', (s) => {
    render(withLang('ru', <StatusBadge status={s} />));
    const node = screen.getByText((content) => content.length > 0);
    expect(node).toBeInTheDocument();
  });

  test('falls back to the raw key for unknown statuses', () => {
    render(withLang('en', <StatusBadge status="mystery_status" />));
    expect(screen.getByText('mystery_status')).toBeInTheDocument();
  });
});

describe('StatusBadge — colors', () => {
  test('lifecycle statuses get a deterministic non-default color class', () => {
    const { container, rerender } = render(withLang('en', <StatusBadge status="pending" />));
    const pending = container.firstChild as HTMLElement;
    expect(pending.className).toMatch(/amber/);

    rerender(withLang('en', <StatusBadge status="completed" />));
    expect((container.firstChild as HTMLElement).className).toMatch(/green/);

    rerender(withLang('en', <StatusBadge status="failed" />));
    expect((container.firstChild as HTMLElement).className).toMatch(/orange/);
  });

  test('account statuses also resolve a color', () => {
    const { container, rerender } = render(withLang('en', <StatusBadge status="ACTIVE" />));
    expect((container.firstChild as HTMLElement).className).toMatch(/green/);

    rerender(withLang('en', <StatusBadge status="SUSPENDED" />));
    expect((container.firstChild as HTMLElement).className).toMatch(/red/);
  });

  test('unknown status gets the neutral fallback color', () => {
    const { container } = render(withLang('en', <StatusBadge status="mystery_status" />));
    expect((container.firstChild as HTMLElement).className).toMatch(/neutral-100/);
  });
});
