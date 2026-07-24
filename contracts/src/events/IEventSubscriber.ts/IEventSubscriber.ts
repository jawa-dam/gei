import type { IEvent } from './IEvent';
import type { IEventHandler } from './IEventHandler';

export interface IEventSubscriber {
  subscribe<TEvent extends IEvent>(handler: IEventHandler<TEvent>): void;
  unsubscribe<TEvent extends IEvent>(handler: IEventHandler<TEvent>): void;
}