import * as MobX from 'mobx';
import { ObjectPropertyType } from '../styleguide/property/object-property-type';
import { PropertyValue } from './property-value';

export interface TypedValueStoreContext {
	propertyId: string;
	proxy: PropertyValueProxy;
}

export class TypedValueStore {
	private context: TypedValueStoreContext;

	@MobX.observable protected selectedTypeId: string | undefined;

	@MobX.observable
	protected typedValues: Map<string | undefined, PropertyValue | PropertyValueProxy> = new Map();

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

	public getValue(typeId?: string): PropertyValue | PropertyValueProxy {
		return this.typedValues.get(typeId);
	}

	public setContext(context: TypedValueStoreContext): void {
		this.context = context;
	}

	public setSelectedTypeId(typeId?: string): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(value: PropertyValue | PropertyValueProxy, typeId?: string): void {
		if (typeof value === typeof undefined) {
			this.typedValues.delete(typeId);
			return;
		}

		if (value instanceof PropertyValueProxy) {
			this.typedValues.set(typeId, value);
			return;
		}

		const typeContext = this.context.proxy.getContext();
		const propertyDefinition = typeContext && typeContext.getProperty(this.context.propertyId);
		const propertyType = typeId && propertyDefinition && propertyDefinition.getType(typeId);

		if (!propertyType) {
			console.warn('setting raw value for unknown property type');
			this.typedValues.set(typeId, value);
			return;
		}

		const coercedValue = propertyType.coerceValue(value);
		this.typedValues.set(typeId, coercedValue);
	}
}

export class PropertyValueProxy {
	private context: ObjectPropertyType | undefined;

	@MobX.observable protected propertyValues: Map<string, TypedValueStore> = new Map();

	public clone(): PropertyValueProxy {
		const clone = new PropertyValueProxy();
		clone.setContext(this.context);

		Array.from(this.propertyValues).forEach(value => {
			const [propertyId, typedValueStore] = value;

			clone.setValue(
				propertyId,
				typedValueStore.clone({
					propertyId,
					proxy: clone
				})
			);
		});

		return clone;
	}

	public getContext(): ObjectPropertyType | undefined {
		return this.context;
	}

	public getTypedValueStore(propertyId: string): TypedValueStore | undefined {
		return this.propertyValues.get(propertyId);
	}

	public getValue(propertyId: string): TypedValueStore | undefined {
		return this.propertyValues.get(propertyId);
	}

	public getValues(): ReadonlyMap<string, TypedValueStore | undefined> {
		return this.propertyValues;
	}

	public setContext(context?: ObjectPropertyType): void {
		this.context = context;
	}

	public setValue(propertyId: string, value?: TypedValueStore, typeId?: string): void {
		if (!value) {
			this.propertyValues.delete(propertyId);
			return;
		}

		this.propertyValues.set(propertyId, value);
	}

	// tslint:disable-next-line:no-any
	public toJsonObject(): { [key: string]: any } {
		const retVal = Array.from(this.propertyValues).reduce((accumulated, propertyEntry) => {
			const [propertyId, typedValueStore] = propertyEntry;
			const propertyValue = typedValueStore.getValue(typedValueStore.getSelectedTypeId());

			if (propertyValue instanceof PropertyValueProxy) {
				return { accumulated, ...propertyValue.toJsonObject() };
			}

			const proxyContext = typedValueStore.getContext().proxy.getContext();
			const propertyDefinition = proxyContext && proxyContext.getProperty(propertyId);
			const selectedTypeId = typedValueStore.getSelectedTypeId();
			const propertyType =
				propertyDefinition && selectedTypeId && propertyDefinition.getType(selectedTypeId);

			const convertedValue = propertyType && propertyType.convertToRender(propertyValue);

			return {
				accumulated,
				...{
					[propertyId]: convertedValue
				}
			};
		}, {});

		return retVal;
	}
}
