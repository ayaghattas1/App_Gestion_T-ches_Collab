/** @type {import('next').NextConfig} */
const nextConfig = {

    images: {
        // Use `remotePatterns` to define allowed image patterns
        remotePatterns: [
          {
            protocol: 'http',
            hostname: 'localhost',
            port: '5000', // Specify the port if needed
            pathname: '/**', // Adjust according to your actual path pattern
            
          },
        ],
      },
};

export default nextConfig;
