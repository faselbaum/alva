import { PropertyType } from './property-type';
import { Store } from '../../../store/store';

/**
 * A property is the meta-information about one styleguide pattern component property
 * (props interface), such as its name and type. Read by the pattern parsers and provided to build
 * the property editing pane.
 * Page elements contain the actual values for each property.
 * @see PageElement
 * @see PatternParser
 */
export class Property {
	/**
	 * The default value of the property when creating a new page element.
	 * This is the Alva default (such as "Lorem Ipsum"), not the default for production component
	 * instantiation (where such defaults sometimes do not make sense).
	 */
	// tslint:disable-next-line:no-any
	private defaultValue: any;

	/**
	 * Whether this property is marked as hidden in Alva (exists in the pattern, but the designer
	 * should not provide content for it).
	 */
	private hidden: boolean = false;

	/**
	 * The technical ID of this property (e.g. the property name in the TypeScript props interface).
	 */
	private id: string;

	/**
	 * The human-friendly name of the property, usually provided by an annotation.
	 * In the frontend, to be displayed instead of the ID.
	 */
	private name: string;

	/**
	 * Whether the designer, when editing a page element, is required to enter a value
	 * for this property.
	 */
	private required: boolean = false;

	// TODO: DOCUMENT
	private supportedTypes: Map<string, PropertyType> = new Map();

	/**
	 * Creates a new property.
	 * @param id The technical ID of this property (e.g. the property name in the TypeScript
	 * props interface). Initially, the name is guessed automatically.
	 */
	public constructor(id: string) {
		this.id = id;
		this.name = Store.guessName(id);
	}

	// TODO: DOCUMENT
	public addSupportedType(type: PropertyType): void {
		this.supportedTypes.set(type.getId(), type);
	}

	/**
	 * Returns the default value of the property when creating a new page element.
	 * This is the Alva default (such as "Lorem Ipsum"), not the default for production component
	 * instantiation (where such defaults sometimes do not make sense).
	 * @return The default value.
	 */
	// tslint:disable-next-line:no-any
	public getDefaultValue(): any {
		return this.defaultValue;
	}

	/**
	 * Returns the technical ID of this property (e.g. the property name in the TypeScript props
	 * interface).
	 * @return The technical ID.
	 */
	public getId(): string {
		return this.id;
	}

	/**
	 * Returns the human-friendly name of the property, usually provided by an annotation.
	 * In the frontend, to be displayed instead of the ID.
	 * @return The human-friendly name of the property.
	 */
	public getName(): string {
		return this.name;
	}

	// TODO: DOCUMENT
	public getSupportedTypes(): PropertyType[] {
		return Array.from(this.supportedTypes.values());
	}

	// tslint:disable-next-line:no-any
	protected getToStringProperties(): [string, any][] {
		return [
			['id', this.id],
			['name', this.name],
			['required', this.required],
			['default', this.defaultValue]
		];
	}

	// TODO: DOCUMENT
	public getType(id: string): PropertyType | undefined {
		return this.supportedTypes.get(id);
	}

	/**
	 * Returns whether this property is marked as hidden in Alva (exists in the pattern, but the designer
	 * should not provide content for it).
	 * @return Whether this property is hidden in Alva.
	 */
	public isHidden(): boolean {
		return this.hidden;
	}

	/**
	 * Returns whether the designer, when editing a page element, is required to enter a value
	 * for this property.
	 * @return Whether the property is required.
	 */
	public isRequired(): boolean {
		return this.required;
	}

	/**
	 * Sets the default value of the property when creating a new page element.
	 * This is the Alva default (such as "Lorem Ipsum"), not the default for production component
	 * instantiation (where such defaults sometimes do not make sense).<br>
	 * <b>Note:</b> This method should only be called from the pattern parsers.
	 * @param defaultValue The default value.
	 */
	// tslint:disable-next-line:no-any
	public setDefaultValue(defaultValue: any): void {
		this.defaultValue = defaultValue;
	}

	/**
	 * Sets whether this property is marked as hidden in Alva (exists in the pattern, but the designer
	 * should not provide content for it).<br>
	 * <b>Note:</b> This method should only be called from the pattern parsers.
	 * @param hidden Whether this property is hidden in Alva.
	 */
	public setHidden(hidden: boolean): void {
		this.hidden = hidden;
	}

	/**
	 * Sets the human-friendly name of the property, usually provided by an annotation.
	 * In the frontend, to be displayed instead of the ID.<br>
	 * <b>Note:</b> This method should only be called from the pattern parsers.
	 * @param name The human-friendly name of the property.
	 */
	public setName(name: string): void {
		this.name = name;
	}

	/**
	 * Sets whether the designer, when editing a page element, is required to enter a value
	 * for this property.<br>
	 * <b>Note:</b> This method should only be called from the pattern parsers.
	 * @param required Whether the property is required.
	 */
	public setRequired(required: boolean): void {
		this.required = required;
	}

	/**
	 * @inheritdoc
	 */
	public toString(): string {
		// tslint:disable-next-line:no-any
		const properties: [string, any][] = this.getToStringProperties();
		return properties.map(([id, value]) => `${id}=${JSON.stringify(value)}`).join(', ');
	}
}
