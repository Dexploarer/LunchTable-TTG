export default {
  providers: [
    {
      type: "customJwt",
      issuer: "privy.io",
      jwks: "https://auth.privy.io/api/v1/apps/cmlnwga5q00y50bl4q14t5vbc/jwks.json",
      applicationID: "cmlnwga5q00y50bl4q14t5vbc",
      algorithm: "ES256",
    },
  ],
};
