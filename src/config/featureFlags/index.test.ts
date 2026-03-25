// @vitest-environment node
import { EdgeConfig } from '@lobechat/edge-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lobechat/edge-config', () => {
  const EdgeConfigMock = vi.fn();
  // @ts-expect-error static mock for isEnabled
  EdgeConfigMock.isEnabled = vi.fn();
  EdgeConfigMock.prototype.getFeatureFlags = vi.fn();

  return { EdgeConfig: EdgeConfigMock };
});

describe('getServerFeatureFlagsFromEdgeConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.FEATURE_FLAGS;
  });

  it('keeps EdgeConfig values when FEATURE_FLAGS is not set', async () => {
    // @ts-expect-error static mock for isEnabled
    EdgeConfig.isEnabled.mockReturnValue(true);
    (EdgeConfig as any).prototype.getFeatureFlags.mockResolvedValue({
      provider_settings: false,
    });

    const { getServerFeatureFlagsFromEdgeConfig } = await import('./index');

    const flags = await getServerFeatureFlagsFromEdgeConfig();

    expect(flags.provider_settings).toBe(false);
  });

  it('allows FEATURE_FLAGS to override EdgeConfig values', async () => {
    process.env.FEATURE_FLAGS = '+provider_settings';

    // @ts-expect-error static mock for isEnabled
    EdgeConfig.isEnabled.mockReturnValue(true);
    (EdgeConfig as any).prototype.getFeatureFlags.mockResolvedValue({
      provider_settings: false,
    });

    const { getServerFeatureFlagsFromEdgeConfig } = await import('./index');

    const flags = await getServerFeatureFlagsFromEdgeConfig();

    expect(flags.provider_settings).toBe(true);
  });
});
