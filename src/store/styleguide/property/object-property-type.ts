import { Property } from './property';
import { PropertyType } from './property-type';

export type PropertyResolver = () => Property[];

// TODO: ADAPT DOCUMENTATION
/**
 * An object property is a property that supports objects with nested property values.
 * The properties field declares the types of each object element.
 * When rendering, the objects are used as-is for the props' property.
 * @see Property
 * @see PatternProperty
 */
export class ObjectPropertyType extends PropertyType {
	/**
	 * The nested properties this property supports in its object values.
	 */
	private properties?: Map<string, Property>;

	private propertyResolver?: PropertyResolver;

	/**
	 * Creates a new object property.
	 * @param id The technical ID of this property (e.g. the property name
	 * in the TypeScript props interface).
	 */
	public constructor(id: string, name?: string) {
		super(`object-${id}`, name);
	}

	/**
	 * @inheritdoc
	 */
	// tslint:disable-next-line:no-any
	public coerceValue(value: any): any {
		if (value === null || value === undefined || value === '') {
			return undefined;
		}

		return value;
	}

	/**
	 * Returns the nested properties this property supports in its object values.
	 * @return The nested properties this property supports.
	 */
	public getProperties(): Property[] {
		return Array.from(this.resolveProperties().values());
	}

	/**
	 * Returns a nested property for a given property ID.
	 * @param id The ID of the property to return.
	 * @return The nested property if the ID was found.
	 */
	public getProperty(id: string): Property | undefined {
		return this.resolveProperties().get(id);
	}

	private resolveProperties(): Map<string, Property> {
		if (!this.properties) {
			if (!this.propertyResolver) {
				throw new Error('property resolver is not set');
			}

			const resolvedProperties = this.propertyResolver();
			const properties = new Map();

			resolvedProperties.forEach(property => properties.set(property.getId(), property));

			this.properties = properties;
		}

		return this.properties;
	}

	/**
	 * Sets The nested properties this property supports in its object values.<br>
	 * <b>Note:</b> This method should only be called from the pattern parsers.
	 * @param properties The nested properties this property supports.
	 */
	public setPropertyResolver(propertyResolver: PropertyResolver): void {
		this.propertyResolver = propertyResolver;
	}
}