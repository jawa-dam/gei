import type { IEventPublisher } from './IEventPublisher';
import type { IEventSubscriber } from './IEventSubscriber';

export interface IEventBus extends IEventPublisher, IEventSubscriber {}