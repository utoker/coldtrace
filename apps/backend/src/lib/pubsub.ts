import { PubSub } from 'graphql-subscriptions';

// Shared PubSub instance for all GraphQL subscriptions
export const pubsub = new PubSub();
