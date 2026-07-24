import type { ConfigurationKey } from '@gei/shared';

export interface IConfiguration {
  get<T>(key: ConfigurationKey): T | undefined;
  set<T>(key: ConfigurationKey, value: T): void;
  has(key: ConfigurationKey): boolean;
}