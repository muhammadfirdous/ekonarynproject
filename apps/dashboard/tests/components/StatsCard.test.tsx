import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '@/components/ui/StatsCard';
import { Package } from 'lucide-react';

describe('StatsCard', () => {
  test('renders title and value', () => {
    render(<StatsCard title="Total Collections" value={42} icon={Package} />);
    expect(screen.getByText('Total Collections')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders subtitle when provided', () => {
    render(<StatsCard title="X" value="1.2 kg" icon={Package} subtitle="this month" />);
    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  test('positive trend renders an up arrow and percent', () => {
    render(
      <StatsCard title="X" value={1} icon={Package} trend={{ value: 12, label: 'vs last' }} />,
    );
    const trendNode = screen.getByText(/12%/);
    expect(trendNode.textContent).toMatch(/↑/);
    expect(trendNode.textContent).toMatch(/vs last/);
  });

  test('negative trend renders a down arrow and absolute percent', () => {
    render(
      <StatsCard title="X" value={1} icon={Package} trend={{ value: -5, label: 'vs last' }} />,
    );
    const trendNode = screen.getByText(/5%/);
    expect(trendNode.textContent).toMatch(/↓/);
    expect(trendNode.textContent).not.toMatch(/-5/); // absolute value, not signed
  });

  test('accent variant applies dark gradient classes', () => {
    const { container } = render(<StatsCard title="X" value="1" icon={Package} variant="accent" />);
    expect((container.firstChild as HTMLElement).className).toMatch(/from-brand-900/);
  });

  test('default variant uses the white card classes', () => {
    const { container } = render(<StatsCard title="X" value="1" icon={Package} />);
    expect((container.firstChild as HTMLElement).className).toMatch(/bg-white/);
  });

  test('honors a custom className', () => {
    const { container } = render(
      <StatsCard title="X" value="1" icon={Package} className="extra-class" />,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(/extra-class/);
  });
});
