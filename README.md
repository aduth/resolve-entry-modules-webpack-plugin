# Resolve Entry Modules Webpack Plugin

Webpack plugin for considering each entry's enclosing directory as a resolve root for all imports within occurring in the dependency tree of that entry. It is effectively the same as defeining a `resolve.modules` for each directory of your `entry` while ensuring that distinct entries cannot import from the others.

## Usage

Imagine the following project structure:

```text
project/
├── entry-one/
│   ├── index.js
│   └── a.js
└── entry-two/
    ├── index.js
    └── a.js
```

For each entry point, we'd like to import `a.js` directly (without relative paths):

```js
var a = require( 'a' );
```

To enable this, we can simply include `ResolveEntryModulesPlugin` as a plugin in our Webpack configuration:

```js
// webpack.config.js
const ResolveEntryModulesPlugin = require( 'resolve-entry-modules-webpack-plugin' );

module.exports = {
	entry: {
		one: './entry-one/index.js',
		two: './entry-two/index.js'
	},
	plugins: [
		new ResolveEntryModulesPlugin()
	]
};
```

## License

See [LICENSE.md](./LICENSE.md).
