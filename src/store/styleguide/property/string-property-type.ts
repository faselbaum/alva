import { PropertyType } from './property-type';

/**
 * A string property is a property that supports text only.
 * As designer content value (raw value), the string property accepts
 * numbers, undefined, and null, as well (see coerceValue()),
 * but everything is converted into a proper string (never undefined or null).
 * @see Property
 */
export class StringPropertyType extends PropertyType {
	/**
	 * The ID of the synthetic string property in the synthetic text content pattern.
	 */
	public static SYNTHETIC_TEXT_ID: string = 'text';

	/**
	 * Creates a new string property.
	 * @param id The technical ID of this property (e.g. the property name
	 * in the TypeScript props interface).
	 */
	public constructor() {
		super('string');
	}

	/**
	 * @inheritdoc
	 */
	// tslint:disable-next-line:no-any
	public coerceValue(value: any): any {
		if (value === null || value === undefined || value === '') {
			return '';
		} else {
			return String(value);
		}
	}
}
