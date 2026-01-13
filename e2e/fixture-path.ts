import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function fixturePath(name: string): string {
  return path.resolve(__dirname, 'fixtures', name);
}

