import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

// next/navigation is mocked in tests/setup.ts; we override usePathname per test
// here using vi.mocked at runtime.
import * as nextNav from 'next/navigation';

function renderSidebar(pathname: string) {
  vi.mocked(nextNav.usePathname).mockReturnValue(pathname);
  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    </LanguageProvider>,
  );
}

beforeEach(() => {
  // Make useRouter / usePathname mocks predictable each test.
  vi.mocked(nextNav.useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as never);
});

describe('Sidebar', () => {
  test('renders the brand and the main nav sections', () => {
    renderSidebar('/');
    // EN dictionary has 'Eko Naryn' as the brand.
    expect(screen.getAllByText('Eko Naryn').length).toBeGreaterThan(0);

    // Section headers (English).
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Directories')).toBeInTheDocument();
  });

  test('renders all the expected nav links', () => {
    renderSidebar('/');
    for (const label of [
      'Overview',
      'Collections',
      'Requests',
      'Routes',
      'Trips',
      'Worker applications',
      'Finance',
      'Analytics',
      'Activity log',
      'Workers',
      'Residents',
      'Materials',
      'Schedule',
      'Settings',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });

  test('the link matching the current pathname gets the active style', () => {
    renderSidebar('/requests');
    const requestsLink = screen.getByRole('link', { name: /Requests/i });
    expect(requestsLink.className).toMatch(/text-brand-400/);
    const overview = screen.getByRole('link', { name: /Overview/i });
    expect(overview.className).not.toMatch(/text-brand-400/);
  });

  test('subpath matching: /workers/pending highlights the pending-workers link', () => {
    renderSidebar('/workers/pending');
    const pending = screen.getByRole('link', { name: /Worker applications/i });
    expect(pending.className).toMatch(/text-brand-400/);
  });

  test('logout button is present', () => {
    renderSidebar('/');
    expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument();
  });
});
