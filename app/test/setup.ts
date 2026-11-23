import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetBackend, server } from './fakeBackend';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetBackend();
  vi.restoreAllMocks();
  document.title = 'Who is next';
});

afterAll(() => server.close());
