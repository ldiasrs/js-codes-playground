import jwt from 'jsonwebtoken';
import { Customer } from '../../domain/Customer';
import { JwtConfiguration } from '../../../../infrastructure/config/jwt.config';

/**
 * Application service for generating JWT authentication tokens.
 * Encapsulates token generation logic.
 */
export class TokenGenerationService {
  constructor(
    private readonly jwtConfiguration: JwtConfiguration = JwtConfiguration.getInstance()
  ) {}

  /**
   * Generates a JWT authentication token for a customer.
   * @param customer The customer entity
   * @returns string The JWT token
   */
  generateToken(customer: Customer): string {
    const jwtConfig = this.jwtConfiguration.getConfig();

    const payload = {
      sub: customer.id?.toString() || '',
      customerId: customer.id?.toString() || ''
    };

    return jwt.sign(
      payload,
      jwtConfig.secret,
      {
        issuer: jwtConfig.issuer,
        algorithm: jwtConfig.algorithm
      }
    );
  }
}

