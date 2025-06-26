export interface SendVerificationCodePortData {
  email: string;
  customerName: string;
  verificationCode: string;
}

export interface SendVerificationCodePort {
  /**
   * Sends a verification code to the customer's email
   * @param data The data containing email, customer name, and verification code
   * @returns Promise<void> Resolves when email is sent successfully
   * @throws Error if email sending fails
   */
  send(data: SendVerificationCodePortData): Promise<void>;
} 