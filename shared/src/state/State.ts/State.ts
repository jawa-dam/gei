export type State =
  | 'created'
  | 'initializing'
  | 'initialized'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'disposed'
  | 'failed';