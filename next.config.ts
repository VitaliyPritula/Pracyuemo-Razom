/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ❗ Next.js не зупинятиме білд, навіть якщо є ESLint-помилки
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
