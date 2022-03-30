import { ExplicitAuthFlowsType } from '@aws-sdk/client-cognito-identity-provider';

export type CognitoFlow = ExplicitAuthFlowsType | string;
