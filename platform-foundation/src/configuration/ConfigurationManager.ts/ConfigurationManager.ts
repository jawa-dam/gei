import type { ConfigurationProvider } from './ConfigurationProvider';

export class ConfigurationManager {
  constructor(private readonly provider: ConfigurationProvider) {}

  async load(): Promise<Record<string, unknown>> {
    return this.provider.load();
  }
}