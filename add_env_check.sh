#!/bin/bash
# Add environment variable check step to GitHub Actions

# Add a step to check if DATABASE_URL is set
sed -i '/- name: Run tests/a\
      - name: Check environment variables\
        run: |\
          echo "🔍 Checking environment variables..."\
          echo "🔍 NODE_ENV: $NODE_ENV"\
          echo "🔍 DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo "true" || echo "false")"\
          if [ -n "$DATABASE_URL" ]; then\
            echo "🔍 DATABASE_URL starts with: ${DATABASE_URL:0:20}..."\
          fi' .github/workflows/ci.yml

echo "Added environment variable check step"
