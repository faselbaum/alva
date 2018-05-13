import { Command } from './command';
import { ElementCommand } from './element-command';
import { PageElement } from '../page/page-element';
import { PropertyValueProxy, TypedValueStore } from '../page/property-value-proxy';

/**
 * A user operation to set the value of a page element property.
 */
export class PropertyValueCommand extends ElementCommand {
	/**
	 * The previous value, for undo.
	 */
	// tslint:disable-next-line:no-any
	protected previousValue: any;

	/**
	 * The ID of the property to modify.
	 */
	protected propertyId: string;

	protected propertyValueProxy: PropertyValueProxy;

	/**
	 * Whether this property value editing is complete now, so that similar value changes do not
	 * merge with this one. If you edit the text of a page element property, all subsequent edits
	 * on this property automatically merge. After leaving the input, setting this property to true
	 * will cause the next text editing on this property to stay a separate undo command.
	 */
	protected sealed: boolean = false;

	protected typedValueStore: TypedValueStore | undefined;

	protected typeId: string;

	// tslint:disable-next-line:no-any
	protected value: any;

	/**
	 * Creates a new user operation to set the value of a page element property.
	 * @param element The element the user operation is performed on.
	 * @param propertyId The ID of the property to change.
	 * @param value The new value for the property.
	 * @param path A dot ('.') separated optional path within an object property to point to a deep
	 * property. E.g., setting propertyId to 'image' and path to 'src.srcSet.xs',
	 * the operation edits 'image.src.srcSet.xs' on the element.
	 */
	// tslint:disable-next-line:no-any
	public constructor(
		value: any,
		element: PageElement,
		propertyValueProxy: PropertyValueProxy,
		propertyId: string,
		typeId: string
	) {
		super(element);

		this.propertyId = propertyId;
		this.value = value;
		this.propertyValueProxy = propertyValueProxy;
		this.typeId = typeId;
		this.typedValueStore = this.propertyValueProxy.getValueStore(propertyId);
		this.previousValue = this.typedValueStore && this.typedValueStore.getValue(typeId);

		if (!this.pageId) {
			throw new Error(
				'Property value commands require that the element is already added to a page'
			);
		}
	}

	/**
	 * @inheritDoc
	 */
	public execute(): boolean {
		if (!super.execute()) {
			return false;
		}

		this.propertyValueProxy.setValue(this.propertyId, this.typeId, this.value);

		return true;
	}

	/**
	 * @inheritDoc
	 */
	public getType(): string {
		return 'property-value';
	}

	/**
	 * @inheritDoc
	 */
	public maybeMergeWith(previousCommand: Command): boolean {
		if (!super.maybeMergeWith(previousCommand)) {
			return false;
		}

		const previousPropertyCommand: PropertyValueCommand = previousCommand as PropertyValueCommand;
		if (
			previousPropertyCommand.sealed ||
			previousPropertyCommand.propertyId !== this.propertyId ||
			previousPropertyCommand.propertyValueProxy !== this.propertyValueProxy
		) {
			return false;
		}

		this.previousValue = previousPropertyCommand.previousValue;
		return true;
	}

	/**
	 * Marks that this property value editing is complete now, so that similar value changes do not
	 * merge with this one. If you edit the text of a page element property, all subsequent edits
	 * on this property automatically merge. After leaving the input, sealing will cause the next
	 * text editing on this property to stay a separate undo command.
	 */
	public seal(): void {
		this.sealed = true;
	}

	/**
	 * @inheritDoc
	 */
	public undo(): boolean {
		if (!super.undo()) {
			return false;
		}

		this.propertyValueProxy.setValue(this.propertyId, this.typeId, this.previousValue);

		return true;
	}
}
