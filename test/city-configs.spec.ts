import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { loadCityConfigs } from '../src/city/city-config.loader';

const CONFIG_DIR = path.resolve(__dirname, '../config/cities');

describe('city configs (runs in CI on every PR)', () => {
  it('every real city file is valid', () => {
    expect(() => loadCityConfigs(CONFIG_DIR)).not.toThrow();
  });

  it('loads every city', () => {
    expect([...loadCityConfigs(CONFIG_DIR).keys()].sort()).toEqual(['delhi', 'dubai', 'mumbai']);
  });

  it('rejects a city that forgets a feature or has a typo', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cities-'));
    fs.writeFileSync(
      path.join(dir, 'pune.yaml'),
      `city: pune
displayName: Pune
timezone: Asia/Kolkatta
currency: INR
languages: [en]
features:
  cash_on_delivery: true
  scheduled_order: true
payments:
  provider: paypal
limits:
  maxOrderValue: 1000
`,
    );
    expect(() => loadCityConfigs(dir)).toThrow(/timezone[\s\S]*live_tracking|live_tracking[\s\S]*timezone/);
    expect(() => loadCityConfigs(dir)).toThrow(/payments\.provider/);
  });
});
