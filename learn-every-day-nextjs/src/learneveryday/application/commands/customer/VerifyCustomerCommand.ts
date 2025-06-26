import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { VerifyCustomerFeature, VerifyCustomerFeatureData, VerifyCustomerFeatureResult } from '../../../domain/customer/usecase/VerifyCustomerFeature';

export interface VerifyCustomerCommandData {
  email: string;
  verificationCode: string;
}

export interface VerifyCustomerCommandResult {
  success: boolean;
  message: string;
  customer?: CustomerDTO;
  token?: string;
}

export class VerifyCustomerCommand extends BaseCommand<VerifyCustomerCommandResult> {
  constructor(
    private readonly data: VerifyCustomerCommandData,
    private readonly verifyCustomerFeature: VerifyCustomerFeature
  ) {
    super();
  }

  async execute(): Promise<VerifyCustomerCommandResult> {
    // Convert command data to feature data
    const featureData: VerifyCustomerFeatureData = {
      email: this.data.email,
      verificationCode: this.data.verificationCode
    };

    // Execute the feature
    const result: VerifyCustomerFeatureResult = await this.verifyCustomerFeature.execute(featureData);

    // Convert result to command result
    const commandResult: VerifyCustomerCommandResult = {
      success: result.success,
      message: result.message,
      token: result.token
    };

    // Convert customer to DTO if present
    if (result.customer) {
      commandResult.customer = CustomerDTOMapper.toDTO(result.customer);
    }

    return commandResult;
  }
} 