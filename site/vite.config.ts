import { defineConfig, loadEnv } from 'vite';

const resolveBuildVersion = (env: Record<string, string>) => {
  return (
    env.VITE_BUILD_VERSION ||
    process.env.VITE_BUILD_VERSION ||
    env.BUILD_VERSION ||
    process.env.BUILD_VERSION ||
    env.GITHUB_SHA ||
    process.env.GITHUB_SHA ||
    env.npm_package_version ||
    process.env.npm_package_version ||
    'local'
  );
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildVersion = resolveBuildVersion(env);
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
