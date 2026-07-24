export interface IPlatformKernel {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isRunning(): boolean;
}