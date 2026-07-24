export class InquiryRuntime {
  create(title: string, observation: string, question: string): {
    id: string;
    title: string;
    observation: string;
    question: string;
  } {
    return {
      id: crypto.randomUUID(),
      title,
      observation,
      question,
    };
  }
}