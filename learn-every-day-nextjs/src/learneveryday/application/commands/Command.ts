export interface Command<TResult = void, TData = void> {
  execute(data?: TData): Promise<TResult>;
}

export abstract class BaseCommand<TResult = void, TData = void> implements Command<TResult, TData> {
  abstract execute(data?: TData): Promise<TResult>;
}

export interface CommandHandler<TCommand extends Command<TResult, TData>, TResult = void, TData = void> {
  handle(command: TCommand, data?: TData): Promise<TResult>;
} 