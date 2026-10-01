/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.openfoodfacts.org' },
            { protocol: 'https', hostname: 'world.openfoodfacts.org' }
        ],
    },
    experimental: {
        // optimizeServerReact: true, // App Router improvements
    }
};

export default withNextIntl(nextConfig);
