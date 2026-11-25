import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { CityConfig, CityConfigSchema } from './city.schema';

/**
 * Reads every config/cities/*.yaml file, validates it, and returns a map keyed by slug.
 * Throws one error listing every problem in every file, so a bad config stops
 * the app at boot (and fails CI) instead of breaking one city at runtime.
 */
export function loadCityConfigs(dir: string): Map<string, CityConfig> {
  if (!fs.existsSync(dir)) throw new Error(`City config directory not found: ${dir}`);

  const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort();
  if (files.length === 0) throw new Error(`No city configs found in ${dir}`);

  const cities = new Map<string, CityConfig>();
  const errors: string[] = [];

  for (const file of files) {
    const slugFromName = file.replace(/\.ya?ml$/, '');
    let raw: unknown;
    try {
      raw = yaml.load(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (e) {
      errors.push(`${file}: invalid YAML (${(e as Error).message})`);
      continue;
    }

    const result = CityConfigSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${file}: ${issue.path.join('.') || '(root)'} - ${issue.message}`);
      }
      continue;
    }

    const config = result.data;
    if (config.city !== slugFromName) {
      errors.push(`${file}: "city: ${config.city}" must match the file name "${slugFromName}"`);
      continue;
    }
    cities.set(config.city, config);
  }

  if (errors.length) {
    throw new Error(`Invalid city configuration:\n  - ${errors.join('\n  - ')}`);
  }
  return cities;
}
