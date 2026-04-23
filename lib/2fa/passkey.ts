// @ts-nocheck — SimpleWebAuthn v11 type exports vary by environment
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const rpName = "Team1 India";
const rpID = process.env.WEBAUTHN_RP_ID || "team1india.vercel.app";
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

export async function getRegistrationOptions(
  userEmail: string,
  existingCredentialIds: string[]
) {
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    attestationType: "none",
    excludeCredentials: existingCredentialIds.map((id: string) => ({
      id: Buffer.from(id, "base64url"),
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  response: any,
  expectedChallenge: string
) {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function getAuthenticationOptions(
  credentialIds: string[]
) {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: credentialIds.map((id: string) => ({
      id: Buffer.from(id, "base64url"),
    })),
    userVerification: "preferred",
  });
}

export async function verifyAuthentication(
  response: any,
  expectedChallenge: string,
  credentialPublicKey: Buffer,
  credentialCounter: number
) {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: response.id,
      publicKey: credentialPublicKey,
      counter: credentialCounter,
    },
  });
}
