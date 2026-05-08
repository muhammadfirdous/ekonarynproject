import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('test infra smoke', () => {
  it('renders a trivial component', () => {
    render(<a href="/">Home</a>);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });
});
