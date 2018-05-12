import { PropertyType } from './property-type';

// TODO: ADAPT DOCUMENTATION
/**
 * A number property is a property that supports numbers only, and undefined.
 * As designer content value (raw value), the number property accepts
 * strings, undefined, and null, as well (see coerceValue()),
 * but everything is converted into a proper number, or undefined.
 * @see Property
 */
export class NumberPropertyType extends PropertyType {
	protected static instance: NumberPropertyType | undefined;

	/**
	 * Creates a new number property.
	 * @param id The technical ID of this property (e.g. the property name
	 * in the TypeScript props interface).
	 */
	protected constructor() {
		super('number');
	}

	public static getInstance(): NumberPropertyType {
		if (!this.instance) {
			this.instance = new NumberPropertyType();
		}

		return this.instance;
	}

	/**
	 * @inheritdoc
	 */
	// tslint:disable-next-line:no-any
	public coerceValue(value: any): any {
		const result: number = parseFloat(value);
		return isNaN(result) ? undefined : result;
	}
}
