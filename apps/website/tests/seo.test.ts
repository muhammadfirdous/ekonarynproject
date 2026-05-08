import { describe, expect, test } from 'vitest';
import { metadata } from '@/app/layout';

// SEO metadata is exported from the App-Router layout. This is what Next.js
// reads when rendering <head> server-side. A snapshot freezes the values that
// ship to crawlers — change deliberately, not accidentally.
describe('SEO: root layout metadata', () => {
  test('title is set and includes the brand', () => {
    expect(metadata.title).toBeTruthy();
    expect(String(metadata.title)).toContain('Eko Naryn');
  });

  test('description is set, mentions key services and the city', () => {
    expect(metadata.description).toBeTruthy();
    const desc = String(metadata.description);
    expect(desc).toMatch(/plastic/i);
    expect(desc).toMatch(/cardboard|paper/i);
    expect(desc).toMatch(/Naryn/);
  });

  test('exact snapshot of the metadata object', () => {
    // If you intentionally change the title or description, update this snapshot.
    expect(metadata).toMatchInlineSnapshot(`
      {
        "description": "Eko Naryn collects plastic, cardboard, and paper from residents in Naryn, Kyrgyzstan. Join us in making our city cleaner.",
        "title": "Eko Naryn - Recycling for a Cleaner Naryn",
      }
    `);
  });
});
