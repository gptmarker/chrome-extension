const esbuild = require('esbuild');
esbuild
	.build({
		entryPoints: ['src/index.js'],
		bundle: true,
		minify: true,
		loader: {
			'.js': 'jsx',
		},
		watch: {
			onRebuild(error) {
				if (error) console.error('watch build failed:', error);
				else console.log('watch build succeeded');
			},
		},
		outfile: 'dist/js/app.js',
	})
	.then(() => {
		console.log('watching...');
	})
	.catch(() => process.exit(1));
