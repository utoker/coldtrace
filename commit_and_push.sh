#!/bin/bash

# Set git to use cat as pager to avoid interactive issues
export GIT_PAGER=cat

# Commit the changes
git commit -m "feat: Major UI/UX overhaul and backend improvements

- Refactor frontend components and remove deprecated alert/websocket debugging components
- Add new UI component library with modern design system  
- Update GraphQL schema and resolvers for improved data handling
- Enhance simulator service with better device management
- Remove obsolete map page and consolidate navigation
- Update database schema and seed data
- Modernize styling with improved Tailwind configuration
- Clean up package dependencies and build configuration
- Add new Navbar and Footer components for better UX"

# Push to main branch
git push origin main
