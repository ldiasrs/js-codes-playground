import { CustomerTier } from '../customer/entities/Customer';

/**
 * Utility class to handle tier-based limits for various features
 */
export class TierLimits {
  /**
   * Gets the maximum number of topics allowed for a customer tier
   * @param tier The customer tier
   * @returns The maximum number of topics allowed
   */
  static getMaxTopicsForTier(tier: CustomerTier): number {
    switch (tier) {
      case CustomerTier.Basic:
        return 1;
      case CustomerTier.Standard:
        return 3;
      case CustomerTier.Premium:
        return 5;
      default:
        return 1; // Default to Basic limit
    }
  }

  /**
   * Checks if a customer can add more topics based on their tier and current topic count
   * @param tier The customer tier
   * @param currentTopicCount The current number of topics the customer has
   * @returns True if the customer can add more topics, false otherwise
   */
  static canAddMoreTopics(tier: CustomerTier, currentTopicCount: number): boolean {
    const maxTopics = this.getMaxTopicsForTier(tier);
    return currentTopicCount < maxTopics;
  }

  /**
   * Gets the remaining topic slots for a customer
   * @param tier The customer tier
   * @param currentTopicCount The current number of topics the customer has
   * @returns The number of remaining topic slots
   */
  static getRemainingTopicSlots(tier: CustomerTier, currentTopicCount: number): number {
    const maxTopics = this.getMaxTopicsForTier(tier);
    const remaining = maxTopics - currentTopicCount;
    return Math.max(0, remaining);
  }
} 