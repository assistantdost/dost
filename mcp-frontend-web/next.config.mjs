/** @type {import('next').NextConfig} */
const nextConfig = {
	reactCompiler: true,
	turbopack: {
		root: "./",
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${
					process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"
				}/:path*`,
			},
		];
	},
};

export default nextConfig;
