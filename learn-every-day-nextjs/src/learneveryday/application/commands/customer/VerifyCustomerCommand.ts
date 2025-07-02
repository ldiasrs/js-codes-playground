import { VerifyAuthCodeFeature, VerifyAuthCodeFeatureData, VerifyAuthCodeFeatureResult } from '../../../domain/customer/usecase/VerifyAuthCodeFeature';
import { BaseCommand } from '../Command';

export interface VerifyCustomerCommandData {
  customerId: string;
  verificationCode: string;
}

export interface VerifyCustomerCommandResult {
  success: boolean;
  message: string;
  customerId?: string;
  token?: string;
}

export class VerifyCustomerCommand extends BaseCommand<VerifyCustomerCommandResult, VerifyCustomerCommandData> {
  constructor(
    private readonly verifyAuthCodeFeature: VerifyAuthCodeFeature
  ) {
    super();
  }

  async execute(data: VerifyCustomerCommandData): Promise<VerifyCustomerCommandResult> {
    // Convert command data to feature data
    const featureData: VerifyAuthCodeFeatureData = {
      customerId: data.customerId,
      verificationCode: data.verificationCode
    };

    // Execute the feature
    const result: VerifyAuthCodeFeatureResult = await this.verifyAuthCodeFeature.execute(featureData);

    // Convert result to command result
    const commandResult: VerifyCustomerCommandResult = {
      success: result.success,
      message: result.message,
      customerId: result.customerId,
      token: result.token
    };


    return commandResult;
  }
} 