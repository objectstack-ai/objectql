import { vi } from 'vitest';

(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  runAllTimers: vi.runAllTimers,
  runAllTimersAsync: async () => { await vi.runAllTimers(); },
  runOneTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  requireActual: vi.importActual, // Slightly different semantics but often works
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  // Add other methods as needed
};
