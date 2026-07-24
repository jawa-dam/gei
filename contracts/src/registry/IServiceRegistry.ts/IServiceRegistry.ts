import type { Identifier } from '@gei/shared';
import type { IServiceDescriptor } from './IServiceDescriptor';

export interface IServiceRegistry {
  register<T>(descriptor: IServiceDescriptor, service: T): void;
  resolve<T>(id: Identifier): T;
  contains(id: Identifier): boolean;
  unregister(id: Identifier): boolean;
  descriptors(): readonly IServiceDescriptor[];
}