import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

import { FirebaseBrowserAuthenticationProvider } from "./firebase-browser";
import { FirebaseBrowserAuthenticationLifecycle } from "./firebase-browser-lifecycle";

interface RFxFirebaseClientGlobals {
  __rfxFirebaseClientApp?: FirebaseApp;
  __rfxFirebaseClientAuth?: Auth;
}

const clientGlobals = globalThis as typeof globalThis & RFxFirebaseClientGlobals;

function requiredPublicConfig(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing Firebase web configuration: ${name}.`);
  }
  return normalized;
}

export function firebaseWebOptionsFromEnvironment(): FirebaseOptions {
  return Object.freeze({
    apiKey: requiredPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requiredPublicConfig(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    ),
    projectId: requiredPublicConfig(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    ),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
    appId: requiredPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  });
}

function configuredAuthEmulatorUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL?.trim();
  return configured || null;
}

function assertLocalEmulatorUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("Firebase Auth emulator URL must be an unencrypted localhost URL.");
  }
  return url.origin;
}

function getClientFirebaseApp(): FirebaseApp {
  if (clientGlobals.__rfxFirebaseClientApp) return clientGlobals.__rfxFirebaseClientApp;

  const app = getApps()[0] ?? initializeApp(firebaseWebOptionsFromEnvironment());
  clientGlobals.__rfxFirebaseClientApp = app;
  return app;
}

export function getClientFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase browser authentication cannot be initialized on the server.");
  }
  if (clientGlobals.__rfxFirebaseClientAuth) return clientGlobals.__rfxFirebaseClientAuth;

  const auth = getAuth(getClientFirebaseApp());
  const emulatorUrl = process.env.NODE_ENV !== "production" ? configuredAuthEmulatorUrl() : null;
  if (emulatorUrl) {
    connectAuthEmulator(auth, assertLocalEmulatorUrl(emulatorUrl), {
      disableWarnings: true,
    });
  }

  clientGlobals.__rfxFirebaseClientAuth = auth;
  return auth;
}

export function createClientAuthenticationProvider(): FirebaseBrowserAuthenticationProvider {
  return new FirebaseBrowserAuthenticationProvider(getClientFirebaseAuth());
}

export function createClientAuthenticationLifecycle(): FirebaseBrowserAuthenticationLifecycle {
  return new FirebaseBrowserAuthenticationLifecycle(getClientFirebaseAuth());
}
