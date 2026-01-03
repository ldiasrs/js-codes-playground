import { Customer } from "@/learneveryday/features/auth/domain/Customer";
import { LoggerPort } from "@/learneveryday/shared/ports/LoggerPort";
import { TierLimits } from "@/learneveryday/shared/TierLimits";

export interface ReGenerateTopicHistoryConfig {
  maxTopicsPer24h: number;
  maxTopicsToProcess: number;
}

/**
 * Builds the configuration for the re-generation process from the customer's tier.
 */
export class CreateConfigService {
  constructor(private readonly logger: LoggerPort, private readonly batchSizeLimit: number) {}

  execute(customer: Customer): ReGenerateTopicHistoryConfig {
    const maxTopicsPer24h = TierLimits.getMaxTopicsPer24hForTier(customer.tier);
    this.logger.info(`Customer ${customer.id} has ${customer.tier} tier with ${maxTopicsPer24h} topics per 24h limit`, {
      customerId: customer.id,
      tier: customer.tier,
      maxTopicsPer24h
    });
    return { maxTopicsPer24h, maxTopicsToProcess: this.batchSizeLimit };
  }
}


