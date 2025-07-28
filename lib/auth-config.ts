import {Amplify, ResourcesConfig} from 'aws-amplify'

export const authConfig : ResourcesConfig = {
  Auth: {
    Cognito: {
      // @ts-ignore
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1',
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      }
    }
  }
};

export const configureAmplify = () => {
  Amplify.configure(authConfig, {ssr: true})
}