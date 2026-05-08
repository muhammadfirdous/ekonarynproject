import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Smoke test: proves Vitest + jsdom + RTL + jest-dom matchers are wired up.
// Specific component/page suites will land in Phase 4.
describe('test infra smoke', () => {
  it('renders a trivial component', () => {
    render(<button type="button">click me</button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('has a working in-memory localStorage stub', () => {
    window.localStorage.setItem('foo', 'bar');
    expect(window.localStorage.getItem('foo')).toBe('bar');
    window.localStorage.removeItem('foo');
    expect(window.localStorage.getItem('foo')).toBeNull();
  });
});
