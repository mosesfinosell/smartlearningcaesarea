import axios from 'axios';
import jwt, { JwtHeader } from 'jsonwebtoken';
import crypto from 'crypto';

export type OAuthProvider = 'google' | 'facebook' | 'apple';

export type ProviderProfile = {
  email: string;
  providerId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  emailVerified?: boolean;
};

const splitName = (fullName?: string) => {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(' ');
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
};

const verifyGoogle = async (idToken: string, clientId?: string): Promise<ProviderProfile> => {
  const { data } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
    params: { id_token: idToken },
  });

  if (clientId && data.aud !== clientId) {
    throw new Error('Google token audience mismatch');
  }

  const { firstName, lastName } = splitName(data.name);

  return {
    email: data.email,
    providerId: data.sub,
    firstName: data.given_name || firstName,
    lastName: data.family_name || lastName,
    name: data.name,
    emailVerified: data.email_verified === 'true' || data.email_verified === true,
  };
};

const verifyFacebook = async (
  accessToken: string,
  appId?: string,
  appSecret?: string
): Promise<ProviderProfile> => {
  if (!appId || !appSecret) {
    throw new Error('Facebook app configuration missing');
  }

  const appAccessToken = `${appId}|${appSecret}`;

  // Validate the token
  const debugUrl = 'https://graph.facebook.com/debug_token';
  const debugParams = { input_token: accessToken, access_token: appAccessToken };
  const debugResp = await axios.get(debugUrl, { params: debugParams });
  const debugData = debugResp.data?.data;

  if (!debugData?.is_valid || debugData.app_id !== appId) {
    throw new Error('Invalid Facebook token');
  }

  // Fetch user profile
  const profileResp = await axios.get('https://graph.facebook.com/me', {
    params: {
      access_token: accessToken,
      fields: 'id,name,first_name,last_name,email',
    },
  });

  const profile = profileResp.data;
  const { firstName, lastName } = splitName(profile.name);

  return {
    email: profile.email,
    providerId: profile.id,
    firstName: profile.first_name || firstName,
    lastName: profile.last_name || lastName,
    name: profile.name,
    emailVerified: true, // Facebook returns verified emails only when available
  };
};

const verifyApple = async (identityToken: string, clientId?: string): Promise<ProviderProfile> => {
  if (!clientId) {
    throw new Error('Apple clientId missing');
  }

  const decoded = jwt.decode(identityToken, { complete: true });

  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid Apple identity token');
  }

  const header = decoded.header as JwtHeader & { kid: string };
  const appleKeys = await axios.get('https://appleid.apple.com/auth/keys');
  const keys: Array<Record<string, string>> = appleKeys.data?.keys || [];
  const jwk = keys.find((k) => k.kid === header.kid);

  if (!jwk) {
    throw new Error('Apple public key not found for token');
  }

  // Node >= 16 can consume JWK directly
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });

  const payload = jwt.verify(identityToken, publicKey, {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: 'https://appleid.apple.com',
  }) as jwt.JwtPayload & {
    email?: string;
    email_verified?: string | boolean;
    sub: string;
  };

  const { firstName, lastName } = splitName(payload.name as string | undefined);

  return {
    email: payload.email || '',
    providerId: payload.sub,
    firstName,
    lastName,
    name: payload.name as string | undefined,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
  };
};

export const verifyProviderToken = async (
  provider: OAuthProvider,
  token: string
): Promise<ProviderProfile> => {
  switch (provider) {
    case 'google':
      return verifyGoogle(token, process.env.GOOGLE_CLIENT_ID);
    case 'facebook':
      return verifyFacebook(token, process.env.FACEBOOK_APP_ID, process.env.FACEBOOK_APP_SECRET);
    case 'apple':
      return verifyApple(token, process.env.APPLE_CLIENT_ID);
    default:
      throw new Error('Unsupported provider');
  }
};
