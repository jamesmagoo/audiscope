import { Amplify, type ResourcesConfig } from "aws-amplify"

export const authConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      // @ts-ignore
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_dummy",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "dummy-client-id",
      signUpVerificationMethod: "code",
      loginWith: {
        email: true,
      },
    },
  },
}

export const configureAmplify = () => {
  const hasValidConfig =
    process.env.NEXT_PUBLIC_USER_POOL_ID &&
    process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID &&
    process.env.NEXT_PUBLIC_USER_POOL_ID !== "us-east-1_dummy"

  if (hasValidConfig) {
    Amplify.configure(authConfig, { ssr: true })
  } else {
    console.warn("AWS Cognito environment variables not configured. Authentication will not work.")
  }
}
