import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'node:child_process';

const resolveGitSha = () => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
  } catch {
    return 'local';
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildVersion = env.VITE_BUILD_VERSION || resolveGitSha();
  const runtimeEnv = env.VITE_ENV || (mode === 'production' ? 'production' : mode);

  process.env.VITE_BUILD_VERSION = buildVersion;
  process.env.VITE_ENV = runtimeEnv;

  return {
    root: '.',
    base: '/',
    publicDir: 'static',
    build: {
      outDir: 'public',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: mode === 'development',
    },
  };
});
