/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'sflsceypiahgbnmacjlv.supabase.co', // User's Supabase URL host
            }
        ]
    }
};

export default nextConfig;

