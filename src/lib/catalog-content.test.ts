import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogDiscoverFilters, isCatalogTitleAllowed } from './catalog-content';

test('filters documentary films and unscripted television across catalog feeds', () => {
  assert.equal(isCatalogTitleAllowed('movie', [99, 12]), false);
  assert.equal(isCatalogTitleAllowed('tv', [99], 'Miniseries'), false);
  assert.equal(isCatalogTitleAllowed('tv', [10764], 'Scripted'), false);
  assert.equal(isCatalogTitleAllowed('tv', [35], 'Talk Show'), false);
  assert.equal(isCatalogTitleAllowed('tv', [10763, 10767]), false);
  assert.equal(isCatalogTitleAllowed('person', []), false);
});

test('keeps scripted genres, soaps, and entries with legacy metadata', () => {
  assert.equal(isCatalogTitleAllowed('tv', [10766, 18], 'Scripted'), true);
  assert.equal(isCatalogTitleAllowed('tv', [10762, 16]), true);
  assert.equal(isCatalogTitleAllowed('movie', undefined), true);
  assert.deepEqual(catalogDiscoverFilters('movie'), { without_genres: '99' });
  assert.deepEqual(catalogDiscoverFilters('tv'), { without_genres: '99,10763,10764,10767', with_type: '2|4|6' });
});
