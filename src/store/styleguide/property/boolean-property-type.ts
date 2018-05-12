import { PropertyType } from './property-type';

// TODO: ADAPT DOCUMENTATION
/**
 * A boolean property is a property that supports the values true and false only.
 * As designer content value (raw value), the boolean property accepts the strings
 * "true" and "false", and the numbers 1 and 0, as well (see coerceValue()).
 * @see Property
 */
export class BooleanPropertyType extends PropertyType {
	protected static instance: BooleanPropertyType | undefined;

	/**
	 * Creates a new boolean property.
	 * @param id The technical ID of this property (e.g. the property name
	 * in the TypeScript props interface).
	 */
	protected constructor() {
		super('boolean');
	}

	public static getInstance(): BooleanPropertyType {
		if (!this.instance) {
			this.instance = new BooleanPropertyType();
		}

		return this.instance;
	}

	/**
	 * @inheritdoc
	 */
	// tslint:disable-next-line:no-any
	public coerceValue(value: any): any {
		return value === true || value === 'true' || value === 1;
	}
}
