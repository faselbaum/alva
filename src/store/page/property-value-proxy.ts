import * as MobX from 'mobx';
import { ObjectPropertyType } from '../styleguide/property/object-property-type';
import { Property } from '../styleguide/property/property';
import { PropertyValue } from './property-value';

export interface PropertyValueProxyContext {
	objectPropertyType: ObjectPropertyType;
	parent?: {
		propertyId: string;
		propertyValueProxy: PropertyValueProxy;
	};
}

export class TypedValueStore {
	private property: Property;

	@MobX.observable protected selectedTypeId: string;

	@MobX.observable protected typedValues: Map<string, PropertyValue> = new Map();

	public constructor(property: Property) {
		this.property = property;

		const supportedTypes = this.property.getSupportedTypes();
		const initiallySelectedTypeId = supportedTypes.length > 0 ? supportedTypes[0].getId() : '';
		this.selectedTypeId = initiallySelectedTypeId;
	}

	public clone(property: Property): TypedValueStore {
		const clone = new TypedValueStore(this.property);
		clone.setSelectedTypeId(this.selectedTypeId);

		Array.from(this.typedValues).forEach(value => {
			const [typeId, typedValue] = value;

			if (typedValue instanceof PropertyValueProxy) {
				clone.setValue(typedValue.clone(), typeId);
				return;
			}

			clone.setValue(typedValue, typeId);
		});

		return clone;
	}

	public getProperty(): Property {
		return this.property;
	}

	public getSelectedTypeId(): string {
		return this.selectedTypeId;
	}

	public getTypedValues(): ReadonlyMap<string, PropertyValue> {
		return this.typedValues;
	}

	public getValue(typeId?: string): PropertyValue {
		return this.typedValues.get(typeId || this.selectedTypeId);
	}

	public setSelectedTypeId(typeId: string): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(value: PropertyValue, typeId?: string): void {
		const usedTypeId = typeId || this.selectedTypeId;
		this.selectedTypeId = usedTypeId;

		if (typeof value === typeof undefined) {
			this.typedValues.delete(usedTypeId);
			return;
		}

		if (value instanceof PropertyValueProxy) {
			this.typedValues.set(usedTypeId, value);
			return;
		}

		const propertyType = this.property.getType(usedTypeId);

		if (!propertyType) {
			console.warn(`Unknown property type ${usedTypeId}. Unable to set value`);
			return;
		}

		const coercedValue = propertyType.coerceValue(value);
		this.typedValues.set(usedTypeId, coercedValue);
	}
}

export class PropertyValueProxy {
	private context: PropertyValueProxyContext;

	@MobX.observable protected isExpanded: boolean = false;

	@MobX.observable protected propertyValues: Map<string, TypedValueStore> = new Map();

	public constructor(context: PropertyValueProxyContext) {
		this.context = context;
	}

	// tslint:disable:no-any
	private static createPropertyJsonValue(
		propertyId: string,
		value?: any,
		typeId?: string,
		wrapWithTypeInfo?: boolean
	): { [propertyId: string]: any } | undefined {
		// tslint:enable:no-any
		if (!value) {
			return undefined;
		}

		if (!wrapWithTypeInfo) {
			return {
				[propertyId]: value
			};
		}

		return {
			[propertyId]: {
				typeId,
				value
			}
		};
	}

	public clone(): PropertyValueProxy {
		const clone = new PropertyValueProxy(this.context);

		Array.from(this.propertyValues).forEach(propertyItem => {
			const [propertyId, valueStore] = propertyItem;
			const property = this.context.objectPropertyType.getProperty(propertyId);

			if (!property) {
				throw new Error(`unable to clone values for property: ${propertyId}`);
			}

			const valueStoreClone = valueStore.clone(property);

			clone.setValueStore(propertyId, valueStoreClone);
		});

		return clone;
	}

	public getContext(): PropertyValueProxyContext {
		return this.context;
	}

	public getIsExpanded(): boolean {
		return this.isExpanded;
	}

	public getValue(propertyId: string, typeId?: string): PropertyValue {
		const valueStore = this.propertyValues.get(propertyId);
		return valueStore && valueStore.getValue(typeId);
	}

	public getValues(): ReadonlyMap<string, TypedValueStore | undefined> {
		return this.propertyValues;
	}

	@MobX.action
	public getValueStore(propertyId: string): TypedValueStore {
		const typedValueStore = this.propertyValues.get(propertyId);

		if (typedValueStore) {
			return typedValueStore;
		}

		const property = this.context.objectPropertyType.getProperty(propertyId);
		if (!property) {
			throw new Error(`Unable to create new ValueStore for property: ${propertyId}`);
		}

		const newValueStore = new TypedValueStore(property);
		this.propertyValues.set(propertyId, newValueStore);

		return newValueStore;
	}

	public setIsExpanded(expanded: boolean): void {
		this.isExpanded = expanded;
	}

	public setValue(propertyId: string, typeId?: string, value?: PropertyValue): void {
		const property = this.context.objectPropertyType.getProperty(propertyId);

		if (!property) {
			throw new Error(`unable to set value for unknown property: ${propertyId}`);
		}

		let typedValueStore = this.propertyValues.get(propertyId);

		if (value) {
			if (!typedValueStore) {
				typedValueStore = new TypedValueStore(property);
				this.propertyValues.set(propertyId, typedValueStore);
			}

			typedValueStore.setValue(value, typeId);

			if (this.context.parent) {
				this.context.parent.propertyValueProxy.setValue(
					this.context.parent.propertyId,
					this.context.objectPropertyType.getId(),
					this
				);
			}

			return;
		} else {
			if (!typedValueStore) {
				return;
			}

			typedValueStore.setValue(value, typeId);

			// Remove store if no values are set for any of the types.
			if (typedValueStore.getTypedValues().size === 0) {
				this.propertyValues.delete(propertyId);
			}

			if (this.context.parent && this.propertyValues.size === 0) {
				this.context.parent.propertyValueProxy.setValue(
					this.context.parent.propertyId,
					this.context.objectPropertyType.getId(),
					undefined
				);
			}
		}
	}

	private setValueStore(propertyId: string, valueStore?: TypedValueStore): void {
		if (!valueStore) {
			this.propertyValues.delete(propertyId);
			return;
		}

		this.propertyValues.set(propertyId, valueStore);
	}

	// tslint:disable-next-line:no-any
	public toJsonObject(forRendering?: boolean): { [key: string]: any } {
		const retVal = Array.from(this.propertyValues).reduce((accumulated, propertyEntry) => {
			const [propertyId, typedValueStore] = propertyEntry;
			if (!typedValueStore) {
				return accumulated;
			}

			const selectedTypeId = typedValueStore.getSelectedTypeId();
			const propertyValue = typedValueStore.getValue(selectedTypeId);

			if (propertyValue instanceof PropertyValueProxy) {
				return {
					...accumulated,
					...PropertyValueProxy.createPropertyJsonValue(
						propertyId,
						propertyValue.toJsonObject(),
						selectedTypeId,
						!forRendering
					)
				};
			}

			const property = typedValueStore.getProperty();
			const propertyType = property.getType(selectedTypeId);

			if (!forRendering) {
				return {
					...accumulated,
					...PropertyValueProxy.createPropertyJsonValue(
						propertyId,
						propertyValue,
						selectedTypeId,
						!forRendering
					)
				};
			}

			if (!propertyType) {
				console.warn(
					`Unable to convert property: ${propertyId} to render. Encountered unknown type: ${selectedTypeId}`
				);
				return accumulated;
			}

			const convertedValue = propertyType.convertToRender(propertyValue);
			return {
				...accumulated,
				...PropertyValueProxy.createPropertyJsonValue(
					propertyId,
					convertedValue,
					selectedTypeId,
					!forRendering
				)
			};
		}, {});

		return retVal;
	}
}
