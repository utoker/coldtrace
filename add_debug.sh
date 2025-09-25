#!/bin/bash
# Add more basic debugging to the test file

# Add basic console.log at the very beginning
sed -i '/import dotenv from '\''dotenv'\'';/a\
console.log("🚀 Test script starting...");\
console.log("🚀 Process env keys:", Object.keys(process.env).filter(key => key.includes("DATABASE")));' apps/simulator/src/test.ts

echo "Added basic debugging"
