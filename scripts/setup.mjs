#!/usr/bin/env node
import fs from 'node:fs/promises';
import readline from 'node:readline';
import { stdin as input, stdout as output, argv } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const pExecFile = promisify(execFile);

const CONFIG_PATH = 'supabase/config.toml';
const PACKAGE_JSON_PATH = 'package.json';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSection(content, section) {
  const sectionRegex = new RegExp(`\\[${escapeRegex(section)}\\]([\\s\\S]*?)(?=\\n\\[|$)`, 'm');
  const match = content.match(sectionRegex);
  return match ? match[0] : null;
}

function updateTomlPortsByScan(content, ops) {
  const lines = content.split(/\r?\n/);
  let current = null;
  const want = new Map(); // section -> key -> { value, found }
  for (const [section, key, value] of ops) {
    if (!want.has(section)) want.set(section, new Map());
    want.get(section).set(key, { value, found: false });
  }
  const sectionRe = /^\s*\[([^\]]+)\]\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const sec = lines[i].match(sectionRe);
    if (sec) {
      current = sec[1];
      continue;
    }
    if (!current || !want.has(current)) continue;
    const keys = want.get(current);
    for (const [key, obj] of keys.entries()) {
      const keyRe = new RegExp(`^\\s*(${escapeRegex(key)}\\s*=\\s*)([^#]+)`);
      const m = lines[i].match(keyRe);
      if (m) {
        lines[i] = lines[i].replace(keyRe, `$1${obj.value}`);
        obj.found = true;
      }
    }
  }
  const missing = [];
  for (const [section, keys] of want.entries()) {
    for (const [key, obj] of keys.entries()) {
      if (!obj.found) missing.push(`${section}.${key}`);
    }
  }
  return { content: lines.join('\n'), missing };
}

const ENV_TARGETS = [
  { dir: '.', example: '.env.example', env: '.env' },
  { dir: 'app-api', example: '.env.example', env: '.env' },
  { dir: 'app-web', example: '.env.example', env: '.env' },
];

async function detectDefaultBase() {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf8');
    const apiSec = getSection(content, 'api');
    if (!apiSec) return 57430;
    const m = apiSec.match(/\bport\s*=\s*(\d{2,5})/);
    if (!m) return 57430;
    const apiPort = Number(m[1]);
    if (Number.isFinite(apiPort)) return apiPort - 1; // 57431 -> 57430
    return 57430;
  } catch {
    return 57430;
  }
}

async function readPackageJsonName() {
  try {
    const txt = await fs.readFile(PACKAGE_JSON_PATH, 'utf8');
    const m = txt.match(/"name"\s*:\s*"([^"]*)"/);
    return m ? m[1] : undefined;
  } catch {
    return undefined;
  }
}

async function readSupabaseProjectId() {
  try {
    const txt = await fs.readFile(CONFIG_PATH, 'utf8');
    const m = txt.match(/^project_id\s*=\s*"([^"]*)"/m);
    return m ? m[1] : undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  try {
    // プロジェクト名の入力（デフォルトは package.json の name → supabase/config.toml の project_id）
    const currentPkgName = await readPackageJsonName();
    const currentSbProjectId = await readSupabaseProjectId();
    const defaultProjectName = currentPkgName || currentSbProjectId || 'web_app_temp';
    const projectAns = (await ask(`プロジェクト名を入力してください [${defaultProjectName}]\n> `)).trim();
    const projectName = projectAns || defaultProjectName;

    // 既存の Google 関連環境変数のデフォルト値を取得（ルート→api→web の順）
    const readEnvForDefaults = async () => {
      const candidates = [
        ['.', '.env'], ['.', '.env.example'],
        ['app-api', '.env'], ['app-api', '.env.example'],
        ['app-web', '.env'], ['app-web', '.env.example'],
      ];
      const out = {};
      for (const [dir, file] of candidates) {
        try {
          const p = dir === '.' ? file : `${dir}/${file}`;
          const txt = await fs.readFile(p, 'utf8');
          for (const line of txt.split(/\r?\n/)) {
            if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
            const [k, ...rest] = line.split('=');
            const key = k.trim();
            const val = rest.join('=').trim();
            if (key === 'GOOGLE_CLOUD_PROJECT_ID' && out.GOOGLE_CLOUD_PROJECT_ID === undefined) out.GOOGLE_CLOUD_PROJECT_ID = val;
            if (key === 'GOOGLE_CLIENT_ID' && out.GOOGLE_CLIENT_ID === undefined) out.GOOGLE_CLIENT_ID = val;
            if (key === 'GOOGLE_CLIENT_SECRET' && out.GOOGLE_CLIENT_SECRET === undefined) out.GOOGLE_CLIENT_SECRET = val;
          }
        } catch {}
      }
      return out;
    };

    const defaults = await readEnvForDefaults();
    const inProj = (await ask(`GOOGLE_CLOUD_PROJECT_ID を入力してください${defaults.GOOGLE_CLOUD_PROJECT_ID ? ` [${defaults.GOOGLE_CLOUD_PROJECT_ID}]` : ''}\n> `)).trim();
    const inId = (await ask(`GOOGLE_CLIENT_ID を入力してください${defaults.GOOGLE_CLIENT_ID ? ` [${defaults.GOOGLE_CLIENT_ID}]` : ''}\n> `)).trim();
    const inSecret = (await ask(`GOOGLE_CLIENT_SECRET を入力してください${defaults.GOOGLE_CLIENT_SECRET ? ` [****既存****]` : ''}\n> `)).trim();
    const GOOGLE = {
      GOOGLE_CLOUD_PROJECT_ID: inProj || defaults.GOOGLE_CLOUD_PROJECT_ID || '',
      GOOGLE_CLIENT_ID: inId || defaults.GOOGLE_CLIENT_ID || '',
      GOOGLE_CLIENT_SECRET: inSecret || defaults.GOOGLE_CLIENT_SECRET || '',
    };

    // 引数で --base=57430、または位置引数(5桁)を許可
    let argBase;
    for (const a of argv.slice(2)) {
      const m = a.match(/^--base=(\d{5})$/);
      if (m) { argBase = m[1]; break; }
      if (/^\d{5}$/.test(a)) { argBase = a; break; }
    }

    const def = await detectDefaultBase();
    let baseInput = argBase;
    if (!baseInput) {
      const ans = (await ask(`Supabase の基点ポートを入力してください [${def}]\n> `)).trim();
      baseInput = ans || String(def);
    }

    const baseStr = baseInput;
    if (!/^\d{5}$/.test(baseStr)) {
      console.error('エラー: 5桁の数値で入力してください (例: 57430)。');
      process.exitCode = 1;
      rl.close();
      return;
    }
    const base = Number(baseStr);
    if (base < 1024 || base > 65000) {
      console.error('エラー: 1024〜65000 の範囲で入力してください。');
      process.exitCode = 1;
      rl.close();
      return;
    }

    console.log(`\n設定を適用します (base=${base})...`);

    const ports = {
      shadow: base,
      api: base + 1,
      db: base + 2,
      studio: base + 3,
      inbucket: base + 4,
      analytics: base + 7,
      realtime: base + 8,
      pooler: base + 9,
    };

    // supabase/config.toml を更新（project_id とポート）
    let content = await fs.readFile(CONFIG_PATH, 'utf8');
    const oldProjectIdMatch = content.match(/^project_id\s*=\s*"([^"]*)"/m);
    const oldProjectId = oldProjectIdMatch ? oldProjectIdMatch[1] : undefined;
    content = content.replace(/^project_id\s*=\s*"([^"]*)"/m, `project_id = "${projectName}"`);
    const ops = [
      ['api', 'port', ports.api],
      ['db', 'port', ports.db],
      ['db', 'shadow_port', ports.shadow],
      ['db.pooler', 'port', ports.pooler],
      ['realtime', 'port', ports.realtime],
      ['studio', 'port', ports.studio],
      ['inbucket', 'port', ports.inbucket],
      ['analytics', 'port', ports.analytics],
    ];
    const scanRes = updateTomlPortsByScan(content, ops);
    content = scanRes.content;
    const failed = scanRes.missing;
    if (failed.length) {
      console.error('エラー: 次の設定を書き換えできませんでした:', failed.join(', '));
      process.exitCode = 1;
      rl.close();
      return;
    }
    await fs.writeFile(CONFIG_PATH, content, 'utf8');

    // package.json の name と supabase:stop の project-id を更新
    try {
      const pkgTxt = await fs.readFile('package.json', 'utf8');
      let updatedPkg = pkgTxt.replace(/("name"\s*:\s*")[^"]*(")/, `$1${projectName}$2`);
      // supabase:stop の project-id を更新（存在する場合のみ）
      updatedPkg = updatedPkg.replace(/("supabase:stop"\s*:\s*"supabase stop --project-id )([^"]+)(")/, `$1${projectName}$3`);
      if (updatedPkg !== pkgTxt) {
        await fs.writeFile('package.json', updatedPkg, 'utf8');
      }
    } catch (e) {
      console.warn('警告: package.json の更新に失敗しました。手動で name と supabase:stop を更新してください。');
    }

    // .env を更新
    const updateUrlPort = (value, newPort) => {
      try {
        const url = new URL(value);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.port = String(newPort);
          return url.toString();
        }
        return value;
      } catch {
        return value;
      }
    };
    const updatePgPort = (value, newPort) =>
      value.replace(
        /(postgres(?:ql)?:\/\/[^@]+@)(127\.0\.0\.1|localhost):(\d{2,5})(\/.*)/,
        (_, pre, host, _old, post) => `${pre}${host}:${newPort}${post}`,
      );

    const ensureEnvUpdated = async (dir) => {
      const exPath = dir === '.' ? '.env.example' : `${dir}/.env.example`;
      const envPath = dir === '.' ? '.env' : `${dir}/.env`;
      let baseContent;
      try {
        baseContent = await fs.readFile(envPath, 'utf8');
      } catch {
        try {
          baseContent = await fs.readFile(exPath, 'utf8');
        } catch {
          return { dir, updated: false, reason: 'example_not_found' };
        }
      }
      const lines = baseContent.split(/\r?\n/);
      const updatedLines = lines.map((line) => {
        if (!line || line.trim().startsWith('#') || !line.includes('=')) return line;
        const [k, ...rest] = line.split('=');
        const key = k.trim();
        const raw = rest.join('=');
        const value = raw.trim();
        switch (key) {
          case 'NEXT_PUBLIC_SUPABASE_URL':
          case 'SUPABASE_URL':
          case 'GOOGLE_REDIRECT_URI':
            return `${key}=${updateUrlPort(value, ports.api)}`;
          case 'DATABASE_URL':
            return `${key}=${updatePgPort(value, ports.db)}`;
          case 'GOOGLE_CLOUD_PROJECT_ID':
            return `${key}=${GOOGLE.GOOGLE_CLOUD_PROJECT_ID}`;
          case 'GOOGLE_CLIENT_ID':
            return `${key}=${GOOGLE.GOOGLE_CLIENT_ID}`;
          case 'GOOGLE_CLIENT_SECRET':
            return `${key}=${GOOGLE.GOOGLE_CLIENT_SECRET}`;
          default:
            return line;
        }
      });
      // キーが存在しない場合は末尾に追記
      const ensureAppend = (key, val) => {
        const exists = updatedLines.some((l) => l.startsWith(`${key}=`));
        if (!exists) updatedLines.push(`${key}=${val}`);
      };
      ensureAppend('GOOGLE_CLOUD_PROJECT_ID', GOOGLE.GOOGLE_CLOUD_PROJECT_ID);
      ensureAppend('GOOGLE_CLIENT_ID', GOOGLE.GOOGLE_CLIENT_ID);
      ensureAppend('GOOGLE_CLIENT_SECRET', GOOGLE.GOOGLE_CLIENT_SECRET);
      const newContent = updatedLines.join('\n');
      await fs.writeFile(envPath, newContent, 'utf8');
      return { dir, updated: true };
    };

    const envResults = [];
    for (const t of ENV_TARGETS) envResults.push(await ensureEnvUpdated(t.dir));

    console.log('Supabase の設定を更新しました:');
    if (typeof oldProjectId !== 'undefined') {
      if (oldProjectId !== projectName) {
        console.log(`- project_id:  ${projectName} (旧: ${oldProjectId})`);
      } else {
        console.log(`- project_id:  ${projectName}`);
      }
    } else {
      console.log(`- project_id:  ${projectName}`);
    }
    console.log(`- shadow_port: ${ports.shadow}`);
    console.log(`- api:         ${ports.api}`);
    console.log(`- db:          ${ports.db}`);
    console.log(`- studio:      ${ports.studio}`);
    console.log(`- inbucket:    ${ports.inbucket}`);
    console.log(`- analytics:   ${ports.analytics}`);
    console.log(`- realtime:    ${ports.realtime}`);
    console.log(`- pooler:      ${ports.pooler}`);
    console.log('\n.env を更新しました:');
    for (const r of envResults) {
      if (r.updated) console.log(`- ${r.dir || '.'}/.env を更新`);
      else console.log(`- ${r.dir || '.'}/.env はスキップ (${r.reason || '不明'})`);
    }

    // Supabase 再起動の確認と実行
    const restartAns = (await ask('\nSupabase を再起動しますか？ [Y/n]\n> ')).trim().toLowerCase();
    const doRestart = restartAns === '' || restartAns === 'y' || restartAns === 'yes';
    if (doRestart) {
      console.log('\nSupabase を再起動しています...');
      try {
        // 旧 project_id があり、変更されていれば先に停止を試みる
        try {
          if (typeof oldProjectId !== 'undefined' && oldProjectId && oldProjectId !== projectName) {
            const stopOld = await pExecFile('supabase', ['stop', '--project-id', oldProjectId], { encoding: 'utf8' });
            if (stopOld.stdout) process.stdout.write(stopOld.stdout);
            if (stopOld.stderr) process.stderr.write(stopOld.stderr);
          }
        } catch (_) {
          // 失敗しても続行
        }
        const stop = await pExecFile('npm', ['run', 'supabase:stop'], { encoding: 'utf8' });
        if (stop.stdout) process.stdout.write(stop.stdout);
        if (stop.stderr) process.stderr.write(stop.stderr);
      } catch (e) {
        console.warn('警告: supabase:stop の実行に失敗しました。続行します。');
        if (e.stdout) process.stdout.write(e.stdout);
        if (e.stderr) process.stderr.write(e.stderr);
      }
      try {
        const start = await pExecFile('npm', ['run', 'supabase:start'], { encoding: 'utf8' });
        if (start.stdout) process.stdout.write(start.stdout);
        if (start.stderr) process.stderr.write(start.stderr);
      } catch (e) {
        console.error('エラー: supabase:start の実行に失敗しました。手動で再起動してください。');
        if (e.stdout) process.stdout.write(e.stdout);
        if (e.stderr) process.stderr.write(e.stderr);
      }
    } else {
      console.log('\n再起動はスキップされました。手動で再起動するには:');
      console.log('npm run supabase:stop && npm run supabase:start');
    }

    console.log('\nセットアップ完了。');
  } catch (err) {
    console.error('セットアップ中にエラーが発生しました:', err);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
