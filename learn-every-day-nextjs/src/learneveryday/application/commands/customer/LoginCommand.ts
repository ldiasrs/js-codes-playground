import { LoginFeature, LoginFeatureData, LoginFeatureResponse } from '../../../domain/customer/usecase/LoginFeature';
import { BaseCommand } from '../Command';

export interface LoginCommandData {
  email: string;
}

export interface LoginCommandResponse {
  success: boolean;
  message: string;
  customerId?: string;
}

export class LoginCommand extends BaseCommand<LoginCommandResponse, LoginCommandData> {
  constructor(
    private readonly authCustomerFeature: LoginFeature
  ) {
    super();
  }

  async execute(data: LoginCommandData): Promise<LoginCommandResponse> {
    // Convert command data to feature data
    const featureData: LoginFeatureData = {
      email: data.email
    };

    // Execute the feature
    const result: LoginFeatureResponse = await this.authCustomerFeature.execute(featureData);

    // Convert result to command result
    const commandResult: LoginCommandResponse = {
      success: result.success,
      message: result.message,
      customerId: result.customerId,
    };

   
    return commandResult;
  }
} 