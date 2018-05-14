import * as MobX from 'mobx';
import { ObjectPropertyType } from '../styleguide/property/object-property-type';
import { PropertyValue } from './property-value';

export interface TypedValueStoreContext {
	propertyId: string;
	proxy: PropertyValueProxy;
}

export class TypedValueStore {
	private static UNKNOWN_TYPE: string = '__unknown_type__';

	private context: TypedValueStoreContext;

	@MobX.observable protected selectedTypeId: string | undefined;

	@MobX.observable protected typedValues: Map<string, PropertyValue> = new Map();

	public constructor(context: TypedValueStoreContext) {
		this.context = context;
	}

	public clone(context: TypedValueStoreContext): TypedValueStore {
		const clone = new TypedValueStore(context);
		clone.setContext(this.context);
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

	public getContext(): TypedValueStoreContext {
		return this.context;
	}

	public getSelectedTypeId(): string | undefined {
		return this.selectedTypeId;
	}

	public getTypedValues(): ReadonlyMap<string, PropertyValue> {
		return this.typedValues;
	}

	public getValue(typeId?: string): PropertyValue {
		return this.typedValues.get(this.normalizeTypeId(typeId));
	}

	protected normalizeTypeId(typeId?: string): string {
		return typeId || TypedValueStore.UNKNOWN_TYPE;
	}

	public setContext(context: TypedValueStoreContext): void {
		this.context = context;
	}

	public setSelectedTypeId(typeId?: string): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(value: PropertyValue, typeId?: string): void {
		if (typeof value === typeof undefined) {
			this.typedValues.delete(this.normalizeTypeId(typeId));
			return;
		}

		if (value instanceof PropertyValueProxy) {
			this.typedValues.set(this.normalizeTypeId(typeId), value);
			return;
		}

		const typeContext = this.context.proxy.getContext();
		const propertyDefinition = typeContext && typeContext.getProperty(this.context.propertyId);
		const propertyType = typeId && propertyDefinition && propertyDefinition.getType(typeId);

		if (!propertyType) {
			console.warn(
				`setting raw value for unknown property type (${this.context.propertyId}: ${value})`
			);
			this.typedValues.set(this.normalizeTypeId(typeId), value);
			return;
		}

		const coercedValue = propertyType.coerceValue(value);
		this.typedValues.set(this.normalizeTypeId(typeId), coercedValue);
	}
}

export class PropertyValueProxy {
	private context: ObjectPropertyType | undefined;

	@MobX.observable protected propertyValues: Map<string, TypedValueStore> = new Map();

	// tslint:disable-next-line:no-any
	private static createPropertyJsonValue(
		propertyId: string,
		typeId?: string,
		value?: any,
		wrapWithTypeInfo?: boolean
	): { [propertyId: string]: any } | undefined {
		if (!value) {
			return undefined;
		}

		if (!wrapWithTypeInfo) {
			return {
				[propertyId]: value
			};
		}

		return {
			typeId,
			value
		};
	}

	public clone(): PropertyValueProxy {
		const clone = new PropertyValueProxy();
		clone.setContext(this.context);

		Array.from(this.propertyValues).forEach(propertyItem => {
			const [propertyId, valueStore] = propertyItem;
			const valueStoreClone = valueStore.clone({
				propertyId,
				proxy: clone
			});

			clone.setValueStore(propertyId, valueStoreClone);
		});

		return clone;
	}

	public getContext(): ObjectPropertyType | undefined {
		return this.context;
	}

	public getValue(propertyId: string, typeId?: string): PropertyValue {
		const valueStore = this.propertyValues.get(propertyId);
		return valueStore && valueStore.getValue(typeId);
	}

	public getValues(): ReadonlyMap<string, TypedValueStore | undefined> {
		return this.propertyValues;
	}

	public getValueStore(propertyId: string): TypedValueStore | undefined {
		return this.propertyValues.get(propertyId);
	}

	public setContext(context?: ObjectPropertyType): void {
		this.context = context;
	}

	public setValue(propertyId: string, typeId?: string, value?: PropertyValue): void {
		let typedValueStore = this.propertyValues.get(propertyId);

		if (value) {
			if (!typedValueStore) {
				typedValueStore = new TypedValueStore({
					propertyId,
					proxy: this
				});

				this.propertyValues.set(propertyId, typedValueStore);
			}

			typedValueStore.setValue(value, typeId);
			return;
		} else {
			if (!typedValueStore) {
				return;
			}

			typedValueStore.setValue(value, typeId);

			// Remove store if no values are set for any of the types.
			if (Array.from(typedValueStore.getTypedValues()).length === 0) {
				this.propertyValues.delete(propertyId);
			}
		}
	}

	public setValueStore(propertyId: string, valueStore?: TypedValueStore): void {
		if (!valueStore) {
			this.propertyValues.delete(propertyId);
			return;
		}

		this.propertyValues.set(propertyId, valueStore);
	}

	// tslint:disable-next-line:no-any
	public toJsonObject(wrapWithTypeInfo?: boolean): { [key: string]: any } {
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
						selectedTypeId,
						propertyValue.toJsonObject(),
						wrapWithTypeInfo
					)
				};
			}

			const proxyContext = typedValueStore.getContext().proxy.getContext();
			const propertyDefinition = proxyContext && proxyContext.getProperty(propertyId);
			const propertyType =
				propertyDefinition && selectedTypeId && propertyDefinition.getType(selectedTypeId);

			const convertedValue = propertyType && propertyType.convertToRender(propertyValue);

			return {
				...accumulated,
				...PropertyValueProxy.createPropertyJsonValue(
					propertyId,
					selectedTypeId,
					convertedValue,
					wrapWithTypeInfo
				)
			};
		}, {});

		return retVal;
	}
}
