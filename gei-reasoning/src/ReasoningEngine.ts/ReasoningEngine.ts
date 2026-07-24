export class ReasoningEngine {
  infer(premises: readonly string[]): string {
    return premises.join(' -> ');
  }
}