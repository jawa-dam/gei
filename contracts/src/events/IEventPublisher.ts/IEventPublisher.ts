import type { IEvent } from './IEvent';

export interface IEventPublisher {
  publish(event: IEvent): Promise<void>;
}