import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { toError } from '@libs/errors';
import { middyfy } from '@libs/lambda';
import * as zod from 'zod';
import errors from 'http-errors';

const EventSchema = zod.object({
  body: zod.object({
    email: zod.string().min(6, 'Code must be at least 3 character long'),
    code: zod.string().min(6, 'Code must be at least 3 character long'),
    newPassword: zod.string().min(6, 'Code must be at least 3 character long'),
  }),
});

type EventSchema = zod.infer<typeof EventSchema>;

interface ConfirmResetPasswordResponse {
  message: string;
}

const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const confirmForgotPasswordHandler = async (
  event: EventSchema,
): Promise<ConfirmResetPasswordResponse> => {
  const { email, code, newPassword } = event.body;

  try {
    await cognitoClient.send(
      new ConfirmForgotPasswordCommand({
        ClientId: userPoolClientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      }),
    );

    return { message: 'Password reset successful' };
  } catch (error) {
    throw new errors.BadRequest(toError(error).message);
  }
};

export const handler = middyfy<EventSchema, ConfirmResetPasswordResponse>(
  confirmForgotPasswordHandler,
);
