export interface InquiryRecord {
  id: string;
  title: string;
  observation: string;
  question: string;
}

export class InquiryEngine {
  createInquiry(title: string, observation: string, question: string): InquiryRecord {
    return {
      id: crypto.randomUUID(),
      title,
      observation,
      question,
    };
  }
}