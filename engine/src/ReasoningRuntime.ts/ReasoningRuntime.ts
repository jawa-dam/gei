export class ReasoningRuntime {
  infer(premises: readonly string[]): string {
    return premises.join(' -> ');
  }
}