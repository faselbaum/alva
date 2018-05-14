import { PropertyValueProxy } from './property-value-proxy';

/**
 * The valid types for each property value, mainly primitives, objects of primitives,
 * page elements, and some arrays.
 */
export type PropertyValue =
	| PropertyValueProxy
	| string
	| string[]
	| number
	| number[]
	| boolean
	| undefined
	| null;
