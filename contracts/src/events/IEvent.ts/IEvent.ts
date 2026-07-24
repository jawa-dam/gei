import type { Identifier, Timestamp } from '@gei/shared';

export interface IEvent {
  id: Identifier;
  name: string;
  timestamp: Timestamp;
  payload?: unknown;
}