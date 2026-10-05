import {env} from 'cloudflare:workers';
import {verifyAccessToken} from '@/lib/access-auth';
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = {
  userId: string;
  legacyUserId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const config=env as unknown as {AUTH_MODE?:string;ACCESS_TEAM_DOMAIN?:string;ACCESS_AUD?:string};
  let platformUserId:string|null=null,email:string|undefined,accessName:string|null=null;
  if(config.AUTH_MODE==='cloudflare-access'){
    const token=requestHeaders.get('cf-access-jwt-assertion');
    if(!token||!config.ACCESS_TEAM_DOMAIN||!config.ACCESS_AUD)return null;
    try{const identity=await verifyAccessToken(token,config.ACCESS_TEAM_DOMAIN,config.ACCESS_AUD);platformUserId=identity.userId;email=identity.email;accessName=identity.fullName;}catch{return null;}
  }else if(config.AUTH_MODE==='sites'){
    platformUserId=requestHeaders.get(USER_ID_HEADER);email=requestHeaders.get(USER_EMAIL_HEADER)?.trim();
  }else return null; // Portable deployment fails closed until an auth mode is set.
  if (!email) return null;

  // The deployed private Sites dispatcher currently forwards authenticated email
  // without a user-id header. These headers are trusted only behind Sites; never
  // accept them directly from public clients on another host.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`drpa-bid-workbench:sites-email:${email.toLowerCase()}`),
  );
  const legacyUserId = `sites-email:${Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")}`;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName = accessName ?? (
    config.AUTH_MODE==='sites' && encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null);

  return {
    userId: platformUserId || legacyUserId,
    legacyUserId,
    displayName: fullName ?? email,
    email,
    fullName,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
