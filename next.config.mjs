/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,  // Disable React Strict Mode
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'randomuser.me'
            }
        ]
    }
};

export default nextConfig;
