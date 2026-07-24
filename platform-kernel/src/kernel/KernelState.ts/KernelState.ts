export type KernelState =
  | 'created'
  | 'booting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed';