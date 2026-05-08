import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '@/components/ui/PageHeader';

describe('PageHeader', () => {
  test('renders the title as an h1', () => {
    render(<PageHeader title="Workers" />);
    expect(screen.getByRole('heading', { level: 1, name: /Workers/ })).toBeInTheDocument();
  });

  test('omits the description paragraph when none is given', () => {
    const { container } = render(<PageHeader title="X" />);
    expect(container.querySelector('p')).toBeNull();
  });

  test('renders description when provided', () => {
    render(<PageHeader title="X" description="manage workers" />);
    expect(screen.getByText('manage workers')).toBeInTheDocument();
  });

  test('renders the action node when provided', () => {
    render(<PageHeader title="X" action={<button type="button">Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});
