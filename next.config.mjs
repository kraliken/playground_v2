/** @type {import('next').NextConfig} */

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  turbopack: {
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;
