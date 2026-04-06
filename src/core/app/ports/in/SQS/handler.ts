import { Callback } from 'aws-lambda'

export interface Handler<TEvent = unknown, TContext = unknown, TResult = unknown> {
  exec:(
    event: TEvent,
    context: TContext,
    callback: Callback<TResult>
  ) => void | Promise<TResult>;
} 