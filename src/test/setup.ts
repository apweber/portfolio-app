import "@testing-library/jest-dom";
import { server } from "./msw/server";

// Resolve relative URLs (e.g. "/api/jobs") to absolute ones so Node's fetch
// can parse them. MSW then intercepts the resulting http://localhost/... URL.
const _originalFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/")) {
    return _originalFetch(`http://localhost${input}`, init);
  }
  return _originalFetch(input, init);
};

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
