'use client';

import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';

export function ClerkSignedIn({ children }: { children: React.ReactNode }) {
  return <SignedIn>{children}</SignedIn>;
}

export function ClerkSignedOut({ children }: { children: React.ReactNode }) {
  return <SignedOut>{children}</SignedOut>;
}

export function ClerkSignInButton() {
  return <SignInButton />;
}

export function ClerkSignUpButton() {
  return <SignUpButton />;
}

export function ClerkUserButton() {
  return <UserButton />;
}