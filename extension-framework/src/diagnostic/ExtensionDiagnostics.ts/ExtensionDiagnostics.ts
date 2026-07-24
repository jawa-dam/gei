import type { ExtensionReport } from './ExtensionReport';

export class ExtensionDiagnostics {
  report(): ExtensionReport {
    return {
      extensionCount: 0,
      loadedCount: 0,
      failedCount: 0,
    };
  }
}