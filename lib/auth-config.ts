import { Amplify } from "aws-amplify"

export const authConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
    },
  },
}

export const configureAmplify = () => {
  Amplify.configure(authConfig, { ssr: true })
}
