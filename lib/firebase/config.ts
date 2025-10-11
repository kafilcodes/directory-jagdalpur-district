/**
 * Firebase Configuration Entry Point
 * 
 * IMPORTANT: This file is imported by both client and server code.
 * Keep imports conditional to avoid bundling issues.
 */

// Server-side functions (use Admin SDK)
export function getServerDb() {
  const { getAdminDb } = require("@/lib/firebase/admin")
  return getAdminDb()
}

export function getServerApp() {
  const { getAdminApp } = require("@/lib/firebase/admin")
  return getAdminApp()
}

export function getServerBucket() {
  const { getAdminBucket } = require("@/lib/firebase/admin")
  return getAdminBucket()
}

// Client-side function (use Client SDK)
export function getClientApp() {
  const { getFirebaseApp } = require("@/lib/firebase/client")
  return getFirebaseApp()
}

