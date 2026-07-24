import type { InquiryRuntime } from './InquiryRuntime';
import type { KnowledgeRuntime } from './KnowledgeRuntime';
import type { ReasoningRuntime } from './ReasoningRuntime';
import type { LearningRuntime } from './LearningRuntime';
import type { SimulationRuntime } from './SimulationRuntime';
import type { AiRuntime } from './AiRuntime';

export class Engine {
  constructor(
    private readonly inquiryRuntime: InquiryRuntime,
    private readonly knowledgeRuntime: KnowledgeRuntime,
    private readonly reasoningRuntime: ReasoningRuntime,
    private readonly learningRuntime: LearningRuntime,
    private readonly simulationRuntime: SimulationRuntime,
    private readonly aiRuntime: AiRuntime,
  ) {}

  getInquiryRuntime(): InquiryRuntime {
    return this.inquiryRuntime;
  }

  getKnowledgeRuntime(): KnowledgeRuntime {
    return this.knowledgeRuntime;
  }

  getReasoningRuntime(): ReasoningRuntime {
    return this.reasoningRuntime;
  }

  getLearningRuntime(): LearningRuntime {
    return this.learningRuntime;
  }

  getSimulationRuntime(): SimulationRuntime {
    return this.simulationRuntime;
  }

  getAiRuntime(): AiRuntime {
    return this.aiRuntime;
  }
}