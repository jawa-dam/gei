export type CapabilityState =
  | 'discovered'
  | 'registered'
  | 'loaded'
  | 'initialized'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed';