#!/bin/bash
# Fix the simulator test to handle environment variables properly

# Replace the dotenv.config() line
sed -i 's/dotenv\.config();/dotenv.config({ silent: true }); \/\/ Silent: don'\''t fail if .env file doesn'\''t exist/' apps/simulator/src/test.ts

# Add debug logging before the DATABASE_URL check
sed -i '/Check if DATABASE_URL is available/a\
console.log(chalk.blue("🔍 Debug: Checking environment variables..."));\
console.log(chalk.blue("🔍 NODE_ENV:", process.env.NODE_ENV));\
console.log(chalk.blue("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL));\
if (process.env.DATABASE_URL) {\
  console.log(chalk.blue("🔍 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 20) + "..."));\
}' apps/simulator/src/test.ts

echo "Fixed simulator test file"
