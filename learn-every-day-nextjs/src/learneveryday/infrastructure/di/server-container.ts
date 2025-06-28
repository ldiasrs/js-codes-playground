import { NextJSContainer } from "./nextjs-container";

export class ServerContainerBuilder {
  private static container: NextJSContainer;

  public static build(): NextJSContainer {
    if (!this.container) {
      this.container = new NextJSContainer();
    }
    return this.container;
  }

  public static reset(): void {
    if (this.container) {
      // Stop cron scheduler before resetting
      this.container.reset();
      this.container = null as unknown as NextJSContainer;
    }
  }

  /**
   * Gracefully shuts down the server container
   */
  public static shutdown(): void {
    if (this.container) {
      this.container = null as unknown as NextJSContainer;
    }
  }
} 