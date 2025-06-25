/**
 * Additional SQL Injection Protection Utilities
 * 
 * While the current implementation is already secure with parameterized queries,
 * these utilities provide additional validation and security layers.
 */

export class SQLInjectionProtection {
  /**
   * Validates that a string contains only safe characters for SQL identifiers
   * @param identifier The identifier to validate
   * @returns true if safe, false if potentially dangerous
   */
  static isValidIdentifier(identifier: string): boolean {
    // Only allow alphanumeric characters, underscores, and hyphens
    const safeIdentifierPattern = /^[a-zA-Z0-9_-]+$/;
    return safeIdentifierPattern.test(identifier);
  }

  /**
   * Validates that a string is safe for LIKE queries
   * @param searchTerm The search term to validate
   * @returns true if safe, false if potentially dangerous
   */
  static isValidSearchTerm(searchTerm: string): boolean {
    // Check for common SQL injection patterns
    const dangerousPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
      /(['"]\s*(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\s*['"])/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(xp_|sp_)\w*\b)/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(searchTerm));
  }

  /**
   * Sanitizes a search term for LIKE queries
   * @param searchTerm The search term to sanitize
   * @returns Sanitized search term
   */
  static sanitizeSearchTerm(searchTerm: string): string {
    // Remove or escape dangerous characters
    return searchTerm
      .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
      .replace(/['"\\]/g, '\\$&'); // Escape quotes and backslashes
  }

  /**
   * Validates UUID format
   * @param uuid The UUID to validate
   * @returns true if valid UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  /**
   * Validates email format
   * @param email The email to validate
   * @returns true if valid email format
   */
  static isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validates date string format
   * @param dateString The date string to validate
   * @returns true if valid ISO date format
   */
  static isValidISODate(dateString: string): boolean {
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return isoDatePattern.test(dateString) && !isNaN(Date.parse(dateString));
  }

  /**
   * Validates numeric input
   * @param value The value to validate
   * @returns true if valid number
   */
  static isValidNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Validates limit parameter for queries
   * @param limit The limit value to validate
   * @param maxLimit Maximum allowed limit
   * @returns Validated limit value
   */
  static validateLimit(limit: unknown, maxLimit: number = 1000): number {
    if (!this.isValidNumber(limit)) {
      return 10; // Default limit
    }
    
    const numLimit = Number(limit);
    if (numLimit < 1) {
      return 1;
    }
    
    if (numLimit > maxLimit) {
      return maxLimit;
    }
    
    return numLimit;
  }

  /**
   * Validates offset parameter for queries
   * @param offset The offset value to validate
   * @returns Validated offset value
   */
  static validateOffset(offset: unknown): number {
    if (!this.isValidNumber(offset)) {
      return 0; // Default offset
    }
    
    const numOffset = Number(offset);
    return Math.max(0, numOffset);
  }
} 