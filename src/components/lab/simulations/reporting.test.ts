import { describe, expect, it, vi } from 'vitest';
import { buildSimReporters } from './reporting';

describe('buildSimReporters', () => {
  it('forwards measurements, observations, and actions into the store', () => {
    const store = { recordMeasurement: vi.fn(), recordAction: vi.fn(), recordObservation: vi.fn() };
    const r = buildSimReporters(store);
    r.onMeasurement(25.1, 'ml', 'Titre value 1', 'Average titre value');
    r.onObservation('colour changed');
    r.onAction('pour', 'app_burette');
    r.onAction('adjust', 'app_dc_power_supply', 6);
    expect(store.recordMeasurement).toHaveBeenCalledWith(25.1, 'ml', 'Titre value 1', 'Average titre value');
    expect(store.recordObservation).toHaveBeenCalledWith('colour changed');
    expect(store.recordAction).toHaveBeenCalledWith('pour', 'app_burette', undefined);
    expect(store.recordAction).toHaveBeenCalledWith('adjust', 'app_dc_power_supply', 6);
  });
});
