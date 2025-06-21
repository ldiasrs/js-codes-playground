export interface Query<TResult> {
  execute(): Promise<TResult>;
}

export abstract class BaseQuery<TResult> implements Query<TResult> {
  abstract execute(): Promise<TResult>;
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
} 