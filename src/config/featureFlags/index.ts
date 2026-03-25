import { EdgeConfig } from '@lobechat/edge-config';
import { createEnv } from '@t3-oss/env-nextjs';
import debug from 'debug';
import { z } from 'zod';

import { merge } from '@/utils/merge';

import { DEFAULT_FEATURE_FLAGS, mapFeatureFlagsEnvToState } from './schema';
import { parseFeatureFlag } from './utils/parser';

const log = debug('lobe-feature-flags');

const env = createEnv({
  runtimeEnv: {
    FEATURE_FLAGS: process.env.FEATURE_FLAGS,
  },

  server: {
    FEATURE_FLAGS: z.string().optional(),
  },
});

export const getServerFeatureFlagsValue = () => {
  const flags = parseFeatureFlag(env.FEATURE_FLAGS);

  const result = merge(DEFAULT_FEATURE_FLAGS, flags);
  return result;
};

/**
 * Get feature flags from EdgeConfig with fallback to environment variables
 * @param userId - Optional user ID for user-specific feature flag evaluation
 */
export const getServerFeatureFlagsFromEdgeConfig = async (userId?: string) => {
  const envFlags = getServerFeatureFlagsValue();

  // Try to get feature flags from EdgeConfig first
  if (EdgeConfig.isEnabled()) {
    try {
      const edgeConfig = new EdgeConfig();
      const edgeFeatureFlags = await edgeConfig.getFeatureFlags();

      if (edgeFeatureFlags && Object.keys(edgeFeatureFlags).length > 0) {
        // Merge defaults + EdgeConfig + env flags so local env can always override
        const edgeMergedFlags = merge(DEFAULT_FEATURE_FLAGS, edgeFeatureFlags);
        const mergedFlags = merge(edgeMergedFlags, envFlags);
        log('[FeatureFlags] Using EdgeConfig flags for user:', userId || 'anonymous');
        return mergedFlags;
      } else {
        log(
          '[FeatureFlags] EdgeConfig returned empty/null/undefined, falling back to environment variables',
        );
      }
    } catch (error) {
      log(
        '[FeatureFlags] Failed to fetch feature flags from EdgeConfig, falling back to environment variables:',
        error,
      );
    }
  } else {
    log('[FeatureFlags] EdgeConfig not enabled, using environment variables');
  }

  log('[FeatureFlags] Using environment variable flags for user:', userId || 'anonymous');
  return envFlags;
};

export const serverFeatureFlags = (userId?: string) => {
  const serverConfig = getServerFeatureFlagsValue();

  return mapFeatureFlagsEnvToState(serverConfig, userId);
};

/**
 * Get server feature flags from EdgeConfig and map them to state with user ID
 * @param userId - Optional user ID for user-specific feature flag evaluation
 */
export const getServerFeatureFlagsStateFromEdgeConfig = async (userId?: string) => {
  const flags = await getServerFeatureFlagsFromEdgeConfig(userId);
  return mapFeatureFlagsEnvToState(flags, userId);
};

export * from './schema';
