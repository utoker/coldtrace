#!/bin/bash
# Fix the test to properly handle environment variables

# Add explicit environment variable check at the very beginning
sed -i '/console.log("🚀 Test script starting...");/a\
console.log("🚀 Environment check:");\
console.log("🚀 All env vars with DATABASE:", Object.keys(process.env).filter(key => key.includes("DATABASE")));\
console.log("🚀 DATABASE_URL from process.env:", process.env.DATABASE_URL ? "EXISTS" : "NOT EXISTS");\
if (process.env.DATABASE_URL) {\
  console.log("🚀 DATABASE_URL length:", process.env.DATABASE_URL.length);\
  console.log("🚀 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 30));\
}' apps/simulator/src/test.ts

echo "Added comprehensive environment variable debugging"
