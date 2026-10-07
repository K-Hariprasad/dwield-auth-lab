import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_FLAGS } from '../context/FeatureFlagsContext.jsx';

describe('Feature Flags Management System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default flag values for all modules', () => {
    expect(DEFAULT_FLAGS.overview).toBe(DEFAULT_FLAGS.overview);
    expect(DEFAULT_FLAGS.signals).toBe(DEFAULT_FLAGS.signals);
    expect(DEFAULT_FLAGS.risk).toBe(DEFAULT_FLAGS.risk);
    expect(DEFAULT_FLAGS.enrollment).toBe(DEFAULT_FLAGS.enrollment);
    expect(DEFAULT_FLAGS.authentication).toBe(DEFAULT_FLAGS.authentication);
    expect(DEFAULT_FLAGS.adaptive).toBe(DEFAULT_FLAGS.adaptive);
    expect(typeof DEFAULT_FLAGS.overview).toBe('boolean');
  });

  it('persists modified feature flag state to localStorage', () => {
    const customFlags = { ...DEFAULT_FLAGS, speech: true, risk: false };
    localStorage.setItem('dwield_lab_feature_flags', JSON.stringify(customFlags));

    const restored = JSON.parse(localStorage.getItem('dwield_lab_feature_flags'));
    expect(restored.risk).toBe(false);
    expect(restored.speech).toBe(true);
  });
});
