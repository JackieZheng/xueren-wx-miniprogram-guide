#!/usr/bin/env node
/**
 * 小程序一键预览 / 上传脚本
 *
 * 用法：
 *   node scripts/publish.js preview [--desc "描述"] [--qrcode-only]
 *   node scripts/publish.js upload  --desc "版本描述" [--version "1.0.0"]
 *   node scripts/publish.js doctor  # 环境自检
 *
 * 环境准备：
 *   npm install miniprogram-ci
 *   # 或者放到 miniprogram-ci-node_modules 目录
 *
 * 必要配置（.env，勿 commit）：
 *   WX_APPID=wxXXXXXXXXXXXX
 *   WX_APPSECRET=xxxxxxxx
 *   WX_UPLOAD_KEY_PATH=./private.key
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync, spawn } = require('child_process');

// ---------- 加载 .env ----------
function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

// ---------- 加载 miniprogram-ci ----------
function loadCI() {
  const candidates = [
    process.env.MP_CI_MODULE,
    'miniprogram-ci',
    path.join(process.cwd(), 'node_modules', 'miniprogram-ci'),
    path.join(__dirname, '..', 'node_modules', 'miniprogram-ci'),
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      // eslint-disable-next-line no-undef
      const mod = require.resolve(c, { paths: [c, process.cwd(), __dirname] });
      return require(mod);
    } catch (e) { /* continue */ }
  }
  throw new Error(
    '找不到 miniprogram-ci。请执行：npm install miniprogram-ci\n' +
    '或通过 MP_CI_MODULE 环境变量指定模块路径。'
  );
}

// ---------- 参数解析 ----------
function parseArgs(argv) {
  const out = { _: [], desc: '', version: '', qrcodeOnly: false, versionDesc: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--desc' || a === '-d') {
      out.desc = out.versionDesc = argv[++i];
    } else if (a === '--version' || a === '-v') {
      out.version = out.desc = argv[++i];
    } else if (a === '--qrcode-only') {
      out.qrcodeOnly = true;
    } else if (!a.startsWith('-')) {
      out._.push(a);
    }
  }
  return out;
}

// ---------- 命令：doctor ----------
function cmdDoctor() {
  console.log('=== 环境自检 ===');
  console.log('AppID:', process.env.WX_APPID || '❌ 未设置');
  console.log('AppSecret:', process.env.WX_APPSECRET ? '✓ 已设置' : '❌ 未设置');
  console.log('UploadKey:', process.env.WX_UPLOAD_KEY_PATH ? '✓ 已设置' : '❌ 未设置');
  console.log('项目根:', process.cwd());

  try {
    const ci = loadCI();
    console.log('miniprogram-ci: ✓ 已加载');
  } catch (e) {
    console.log('miniprogram-ci: ❌ ' + e.message);
  }

  const configPath = path.resolve(process.cwd(), 'project.config.json');
  console.log('project.config.json:', fs.existsSync(configPath) ? '✓' : '❌');
  const appJsonPath = path.resolve(process.cwd(), 'app.json');
  console.log('app.json:', fs.existsSync(appJsonPath) ? '✓' : '❌');
}

// ---------- 命令：preview ----------
function cmdPreview(opts) {
  const ci = loadCI();
  const appid = process.env.WX_APPID;
  if (!appid) throw new Error('请先设置 WX_APPID 到 .env');

  const previewOptions = {
    project: process.cwd(),
    appid,
    desc: opts.desc || 'WB 预览版本',
    qrcodeOutput: path.join(process.cwd(), 'log', 'preview_qrcode.png'),
    setting: {
      urlCheck: false,
      es6: true,
      minify: true,
      autoPrefixWXSS: true,
    },
  };

  if (process.env.WX_UPLOAD_KEY_PATH && fs.existsSync(process.env.WX_UPLOAD_KEY_PATH)) {
    previewOptions.keyPath = process.env.WX_UPLOAD_KEY_PATH;
  } else if (process.env.WX_APPSECRET) {
    previewOptions.appsecret = process.env.WX_APPSECRET;
  }

  console.log('📤 正在生成预览二维码...');
  return ci.preview(previewOptions).then((res) => {
    console.log('✅ 预览完成');
    if (res && res.qrcode) {
      console.log('   QR 保存于:', previewOptions.qrcodeOutput);
    }
  });
}

// ---------- 命令：upload ----------
function cmdUpload(opts) {
  const ci = loadCI();
  const appid = process.env.WX_APPID;
  if (!appid) throw new Error('请先设置 WX_APPID 到 .env');
  if (!opts.desc) throw new Error('请提供 --desc "版本描述"');

  const uploadOptions = {
    project: process.cwd(),
    appid,
    version: opts.version || opts.desc,
    desc: opts.desc,
    setting: {
      urlCheck: false,
      es6: true,
      minify: true,
      autoPrefixWXSS: true,
    },
  };

  if (process.env.WX_UPLOAD_KEY_PATH && fs.existsSync(process.env.WX_UPLOAD_KEY_PATH)) {
    uploadOptions.keyPath = process.env.WX_UPLOAD_KEY_PATH;
  } else if (process.env.WX_APPSECRET) {
    uploadOptions.appsecret = process.env.WX_APPSECRET;
  } else {
    throw new Error('需要 WX_UPLOAD_KEY_PATH 或 WX_APPSECRET');
  }

  console.log('📤 上传到「开发版本」...');
  console.log('   版本号:', uploadOptions.version);
  console.log('   描述:', uploadOptions.desc);
  return ci.upload(uploadOptions).then((res) => {
    console.log('✅ 上传成功');
    console.log('   请到后台提交审核: https://mp.weixin.qq.com → 开发 → 版本管理');
    if (res && res.code) console.log('   审核码:', res.code);
  });
}

// ---------- 命令：review（半自动 checklist） ----------
function cmdReview(opts) {
  const version = opts.version || opts.desc || 'v1.0.0';
  const startedAt = new Date().toISOString();
  const checklist = `# 发布前 Checklist · v${version}

- 提交时间：${startedAt}
- 版本描述：${opts.desc || '(未填)'}

## 7 步流程

1. [ ] doctor 通过（环境自检）
2. [ ] preview 通过（真机扫码看效果）
3. [ ] upload 成功（本地上传到「开发版本」）
4. [ ] 后台「版本管理」能看到新版本
5. [ ] 手动点「提交审核」
6. [ ] 等审核（官方口径 1-7 工作日）
7. [ ] 审核通过 → 点「发布」上线

## 参考

- 审核时长：1-7 工作日（多数 1-3 天）
- 提审入口：https://mp.weixin.qq.com → 版本管理
- 更多坑：references/pitfalls.md
`;
  const logDir = path.join(process.cwd(), 'log');
  fs.mkdirSync(logDir, { recursive: true });
  const file = path.join(logDir, `release_checklist_${version}.md`);
  fs.writeFileSync(file, checklist, 'utf8');
  console.log('📝 Checklist 已生成:', file);
  console.log('\n=== 下一步手动操作 ===');
  console.log('1. 打开 https://mp.weixin.qq.com');
  console.log('2. 进入「版本管理」');
  console.log('3. 找到刚上传的开发版本');
  console.log('4. 点「提交审核」');
  console.log('5. 填变更说明 + 选类目');
  console.log('6. 等待审核（1-7 工作日）');
}

// ---------- 主入口 ----------
function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'help';

  switch (cmd) {
    case 'preview':
    case 'p':
      return cmdPreview(args);
    case 'upload':
    case 'up':
      return cmdUpload(args);
    case 'review':
    case 'r':
      return cmdReview(args);
    case 'doctor':
    case 'd':
      return cmdDoctor();
    case 'help':
    case '-h':
    case '--help':
      console.log('用法:');
      console.log('  node scripts/publish.js doctor                   # 环境自检');
      console.log('  node scripts/publish.js preview [--desc "描述"]  # 出预览二维码');
      console.log('  node scripts/publish.js upload --desc "描述"     # 上传到开发版本');
      console.log('  node scripts/publish.js review --desc "描述"     # 生成 checklist');
      break;
    default:
      console.error('未知命令:', cmd);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
