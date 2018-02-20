/**
 * External dependencies
 */

const { resolve } = require( 'path' );
const { expect } = require( 'chai' );
const webpack = require( 'webpack' );
const mockery = require( 'mockery' );

/**
 * Internal dependencies
 */

const config = require( './fixtures/webpack.config.js' );

describe( 'ResolveEntryModulesPlugin', () => {
	let ResolveEntryModulesPlugin;

	before( () => {
		mockery.registerMock( 'resolve-from', ( source, path ) => {
			return resolve( source, path );
		} );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false,
		} );

		ResolveEntryModulesPlugin = require( '../' );
	} );

	after( () => {
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '.getNormalizedEntry()', () => {
		it( 'should return object with simple values verbatim', () => {
			const entry = { main: './index.js' };
			const normalized = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

			expect( normalized ).to.eql( entry );
		} );

		it( 'should return object with arrays flattened', () => {
			const entry = {
				main: './index.js',
				multi: [ './one.js', './two.js' ]
			};
			const normalized = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

			expect( normalized ).to.eql( {
				main: './index.js',
				'./one.js': './one.js',
				'./two.js': './two.js'
			} );
		} );

		it( 'should return plain string as object of entry: entry', () => {
			const entry = './index.js';
			const normalized = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

			expect( normalized ).to.eql( {
				'./index.js': './index.js'
			} );
		} );

		it( 'should return function of plain string as object of entry: entry', () => {
			const entry = () => './index.js';
			const normalized = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

			expect( normalized ).to.eql( {
				'./index.js': './index.js'
			} );
		} );

		it( 'should throw if cannot handle input type', () => {
			const entry = Promise.resolve();

			expect( ResolveEntryModulesPlugin.getNormalizedEntry.bind( null, entry ) ).to.throw;
		} );

		it( 'should return array as zipped entry, entry array', () => {
			const entry = [ './one.js', './two.js' ];
			const normalized = ResolveEntryModulesPlugin.getNormalizedEntry( entry );

			expect( normalized ).to.eql( {
				'./one.js': './one.js',
				'./two.js': './two.js'
			} );
		} );
	} );

	describe( '.getEntryRoots()', () => {
		it( 'should return a unique array of absolute path directories', () => {
			const entry = [ './one.js', './two.js' ];
			const entryRoots = ResolveEntryModulesPlugin.getEntryRoots( entry, 'src' );

			expect( entryRoots ).to.eql( [ resolve( process.cwd(), 'src' ) ] );
		} );
	} );

	describe( '#apply()', () => {
		it( 'should resolve without errors', ( done ) => {
			webpack( config, ( err, stats ) => {
				if ( err ) {
					return done( err );
				} else if ( stats.hasErrors() ) {
					return done( stats.toString() );
				}

				done();
			} );
		} );
	} );
} );
