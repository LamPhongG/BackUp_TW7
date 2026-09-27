import { render, act } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import HrReports from '../src/pages/hr/Reports';
import * as apiClient from '../src/services/apiClient';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/services/apiClient', () => {
  return {
    backendEnabled: vi.fn(() => true),
    apiRequest: vi.fn(),
  };
});
const mockUser = { role: 'hr' };
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));
const mockPaths = [];
vi.mock('../src/contexts/PathsContext', () => ({
  usePaths: () => ({ paths: mockPaths })
}));
const mockDocs = [];
vi.mock('../src/contexts/DocumentsContext', () => ({
  useDocuments: () => ({ documents: mockDocs })
}));
const mockLang = { t: (k) => k, tv: (k) => k, pick: (k) => k, locale: 'vi' };
vi.mock('../src/contexts/LanguageContext', () => ({
  useLanguage: () => mockLang
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('HrReports renders 0 or nulls when APIs return empty arrays', async () => {
  apiClient.apiRequest.mockResolvedValue([]);
  let container;
  await act(async () => {
    const res = render(<MemoryRouter><HrReports /></MemoryRouter>);
    container = res.container;
  });
  
  const text = container.textContent;
  
  expect(text).not.toContain('98.5%');
  expect(text).not.toContain('DOC-SEC-99');
});
