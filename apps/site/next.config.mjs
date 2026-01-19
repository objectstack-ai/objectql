import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  typescript: {
    // Allow building even if some example files or optional packages lack types
    ignoreBuildErrors: true,
  },
};

export default withMDX(config);
