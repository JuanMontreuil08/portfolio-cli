import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { PortfolioSchema, type Portfolio } from './schema.js';

export function loadPortfolio(yamlPath?: string): Portfolio {
  const filePath = yamlPath ?? path.resolve(process.cwd(), 'core/portfolio.yaml');

  if (!fs.existsSync(filePath)) {
    throw new Error(`portfolio.yaml not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parse(raw);

  const result = PortfolioSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`portfolio.yaml tiene errores de validación:\n${issues}`);
  }

  return result.data;
}
