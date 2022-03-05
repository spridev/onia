import { Context } from 'aws-lambda';
import { PartialDeep } from 'type-fest';

/**
 * Create a lambda context.
 */
export function createContext(overrides?: PartialDeep<Context>): Context {
  const defaults: Context = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'function-name',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:eu-central-1:1:function:function-name',
    memoryLimitInMB: '128',
    awsRequestId: 'cf3f1245-c06a-465d-8cb0-2e3675232ba1',
    logGroupName: '/aws/lambda/function-name',
    logStreamName: '2022/01/01/[$LATEST]ebb171a1c9dc4d2ab0d2e0c6a8eea99c',
    getRemainingTimeInMillis: {} as any,
    done: {} as any,
    fail: {} as any,
    succeed: {} as any,
  };

  return Object.assign(defaults, overrides);
}
