export interface Command<TResult = void> {
  execute(): Promise<TResult>;
}

export abstract class BaseCommand<TResult = void> implements Command<TResult> {
  abstract execute(): Promise<TResult>;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
} 