export interface Query<TResult, TData = void> {
  execute(data?: TData): Promise<TResult>;
}

export abstract class BaseQuery<TResult, TData = void> implements Query<TResult, TData> {
  abstract execute(data?: TData): Promise<TResult>;
}

export interface QueryHandler<TQuery extends Query<TResult, TData>, TResult, TData = void> {
  handle(query: TQuery, data?: TData): Promise<TResult>;
} 