import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from '@/components/ui/DataTable';
import { LanguageProvider } from '@/lib/i18n';
import type { ColumnDef } from '@tanstack/react-table';

interface Row {
  id: string;
  name: string;
  amount: number;
}

const COLUMNS: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
];

function renderTable(data: Row[], opts: { searchPlaceholder?: string } = {}) {
  return render(
    <LanguageProvider initialLang="en">
      <DataTable<Row> columns={COLUMNS} data={data} searchPlaceholder={opts.searchPlaceholder} />
    </LanguageProvider>,
  );
}

describe('DataTable', () => {
  test('renders header row with column titles and sort affordance', () => {
    renderTable([{ id: '1', name: 'Alpha', amount: 1 }]);
    const head = screen.getAllByRole('columnheader');
    expect(head).toHaveLength(2);
    expect(head[0]).toHaveTextContent('Name');
    expect(head[1]).toHaveTextContent('Amount');
  });

  test('empty state renders the localized "no data" cell that spans every column', () => {
    renderTable([]);
    const empty = screen.getByText(/No data/i); // EN dictionary: 'No data'
    const cell = empty.closest('td')!;
    expect(cell.getAttribute('colspan')).toBe('2');
  });

  test('sorting on header click toggles row order', async () => {
    const user = userEvent.setup();
    renderTable([
      { id: '1', name: 'Charlie', amount: 30 },
      { id: '2', name: 'Alpha', amount: 10 },
      { id: '3', name: 'Bravo', amount: 20 },
    ]);

    const initialNames = screen
      .getAllByRole('row')
      .slice(1) // skip header row
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(initialNames).toEqual(['Charlie', 'Alpha', 'Bravo']);

    await user.click(screen.getByText('Name'));
    const sortedAsc = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(sortedAsc).toEqual(['Alpha', 'Bravo', 'Charlie']);

    await user.click(screen.getByText('Name'));
    const sortedDesc = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(sortedDesc).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  test('search box (when placeholder given) filters rows on input', async () => {
    const user = userEvent.setup();
    renderTable(
      [
        { id: '1', name: 'Alpha', amount: 10 },
        { id: '2', name: 'Bravo', amount: 20 },
        { id: '3', name: 'AlphaBravo', amount: 30 },
      ],
      { searchPlaceholder: 'Search…' },
    );

    const input = screen.getByPlaceholderText('Search…');
    await user.type(input, 'Alpha');
    const visible = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(visible).toEqual(['Alpha', 'AlphaBravo']);
  });

  test('search box is hidden when no placeholder is provided', () => {
    renderTable([{ id: '1', name: 'A', amount: 1 }]);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('pagination buttons disable at the page boundaries; next advances', async () => {
    const user = userEvent.setup();
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `R${i}`,
      amount: i,
    }));
    renderTable(data);
    // pageSize = 10 → 3 pages (25 / 10).
    const [prevBtn, nextBtn] = screen.getAllByRole('button');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();

    await user.click(nextBtn);
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    await user.click(nextBtn);
    expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();
  });
});
