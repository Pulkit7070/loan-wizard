/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@loan-wizard/contracts',
    '@loan-wizard/perception',
    '@tensorflow/tfjs',
    '@tensorflow-models/blazeface',
    '@tensorflow-models/face-landmarks-detection',
  ],
};

module.exports = nextConfig;
