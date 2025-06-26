import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { AuthCustomerFeature, AuthCustomerFeatureData, AuthCustomerFeatureResult } from '../../../domain/customer/usecase/AuthCustomerFeature';

export interface AuthCustomerCommandData {
  email: string;
}

export interface AuthCustomerCommandResult {
  success: boolean;
  message: string;
  customer?: CustomerDTO;
  verificationCode?: string;
}

export class AuthCustomerCommand extends BaseCommand<AuthCustomerCommandResult> {
  constructor(
    private readonly data: AuthCustomerCommandData,
    private readonly authCustomerFeature: AuthCustomerFeature
  ) {
    super();
  }

  async execute(): Promise<AuthCustomerCommandResult> {
    // Convert command data to feature data
    const featureData: AuthCustomerFeatureData = {
      email: this.data.email
    };

    // Execute the feature
    const result: AuthCustomerFeatureResult = await this.authCustomerFeature.execute(featureData);

    // Convert result to command result
    const commandResult: AuthCustomerCommandResult = {
      success: result.success,
      message: result.message,
      verificationCode: result.verificationCode
    };

    // Convert customer to DTO if present
    if (result.customer) {
      commandResult.customer = CustomerDTOMapper.toDTO(result.customer);
    }

    return commandResult;
  }
} 