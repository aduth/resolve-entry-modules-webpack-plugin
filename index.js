/**
 * External dependencies
 */

const { dirname } = require( 'path' );
const containsPath = require( 'contains-path' );
const resolveFrom = require( 'resolve-from' );
const { reduce, zipObject, uniq, map, isPlainObject, find, assign } = require( 'lodash' );

module.exports = class ResolveEntryModulesPlugin {
	/**
	 * Given an entry configuration, returns entries in a normalized object form.
	 *
	 * @param  {*}      entry Entry configuration
	 * @return {Object}       Normalized entry configuration
	 */
	static getNormalizedEntry( entry ) {
		if ( isPlainObject( entry ) ) {
			return reduce( entry, ( memo, value, key ) => {
				if ( Array.isArray( value ) ) {
					assign( memo, ResolveEntryModulesPlugin.getNormalizedEntry( value ) );
				} else {
					memo[ key ] = value;
				}

				return memo;
			}, {} );
		}

		if ( 'function' === typeof entry ) {
			return ResolveEntryModulesPlugin.getNormalizedEntry( entry() );
		}

		if ( 'string' === typeof entry ) {
			return ResolveEntryModulesPlugin.getNormalizedEntry( [ entry ] );
		}

		if ( ! Array.isArray( entry ) ) {
			throw new TypeError(
				'ResolveEntryModulesPlugin cannot handle entry value of type `' + typeof entry + '`'
			);
		}

		return zipObject( entry, entry );
	}

	/**
	 * Maps normalized entry configuration into unique array of absolute
	 * containing path directories.
	 *
	 * @param  {*}        entry   Compiler options entry
	 * @param  {string}   context Compiler options context
	 * @return {string[]}         Entry absolute containing path directories
	 */
	static getEntryRoots( entry, context ) {
		entry = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

		return uniq( map( entry, ( path ) => {
			// Cannot resolve paths with query parameters, so remove
			path = path.replace( /\?.*/, '' );

			return dirname( resolveFrom( context, path ) );
		} ) );
	}

	apply( compiler ) {
		const { entry, context } = compiler.options;
		const entryRoots = ResolveEntryModulesPlugin.getEntryRoots( entry, context );

		compiler.hooks.afterResolvers.tap( 'ResolveEntryModulesPlugin', () => {
			compiler.resolverFactory.hooks.resolver.for( 'normal' ).tap( 'ResolveEntryModulesPlugin', ( resolver ) => {
				resolver.hooks.module.tapAsync( 'ResolveEntryModulesPlugin', ( request, resolverContext, callback ) => {
					// Find entry root which contains the requesting path
					const resolvePath = find(
						entryRoots,
						containsPath.bind( null, request.path )
					);

					if ( ! resolvePath ) {
						return callback();
					}

					// Add entry root as resolve base path
					const obj = assign( {}, request, {
						path: resolvePath,
						request: './' + request.request,
					} );

					resolver.doResolve( resolver.hooks.resolve, obj, '', resolverContext, callback );
				} );
			} );
		} );
	}
};
