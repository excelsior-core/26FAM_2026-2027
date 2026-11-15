import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { loadVault, saveVault, ROOT } from './vault.mjs';
import { scan, build } from './library.mjs';

const PROJECT_ROOT = path.resolve(ROOT, '..');
const EXPORT_DIR = path.join(ROOT, 'export');
const DIST_DIR = path.join(PROJECT_ROOT, '.gh-dist');
const REPO_URL = 'https://github.com/excelsior-core/26FAM_2026-2027.git';

async function deploy() {
  console.log('=== СБОРКА И ПУБЛИКАЦИЯ НА GITHUB PAGES ===\n');

  // 1. Build export
  console.log('1. Подготовка криптографической сборки...');
  const vault = await loadVault();
  await saveVault(vault);
  await scan(vault);
  const report = await build(vault, s => console.log('  ->', s));
  console.log(`  Собрано: ${report.records} лекций, ${report.attachments} вложений, размер: ${(report.bytes/1024/1024).toFixed(1)} МБ\n`);

  // 2. Prepare dist directory
  console.log('2. Подготовка области публикации...');
  try { await fs.rm(DIST_DIR, { recursive: true, force: true }); } catch {}
  await fs.mkdir(DIST_DIR, { recursive: true });

  // Copy export contents to DIST_DIR
  await fs.cp(EXPORT_DIR, DIST_DIR, { recursive: true });

  // Add .nojekyll
  await fs.writeFile(path.join(DIST_DIR, '.nojekyll'), '');

  // 3. Git deployment to gh-pages branch
  console.log('3. Отправка сборки в ветку gh-pages на GitHub...');
  execSync('git init', { cwd: DIST_DIR, stdio: 'ignore' });
  execSync('git config user.name "FAM HSE Deployer"', { cwd: DIST_DIR, stdio: 'ignore' });
  execSync('git config user.email "student@hse.ru"', { cwd: DIST_DIR, stdio: 'ignore' });
  execSync('git checkout -b gh-pages', { cwd: DIST_DIR, stdio: 'ignore' });
  execSync('git add -A', { cwd: DIST_DIR, stdio: 'ignore' });
  execSync(`git commit -m "Deploy FAM: ${new Date().toISOString()}"`, { cwd: DIST_DIR, stdio: 'ignore' });
  execSync(`git remote add origin ${REPO_URL}`, { cwd: DIST_DIR, stdio: 'ignore' });

  console.log('  Выполняется force-push в ветку gh-pages...');
  execSync('git push -f origin gh-pages', { cwd: DIST_DIR, stdio: 'inherit' });

  // Cleanup dist
  try { await fs.rm(DIST_DIR, { recursive: true, force: true }); } catch {}

  console.log('\n УСПЕШНО ОПУБЛИКОВАНО НА GITHUB PAGES!');
  console.log('Адрес сайта: https://excelsior-core.github.io/26FAM_2026-2027/');
}

deploy().catch(err => {
  console.error('\n Ошибка публикации:', err.message);
  process.exit(1);
});
