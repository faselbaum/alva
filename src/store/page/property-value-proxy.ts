import * as MobX from 'mobx';
import { ObjectPropertyType } from '../styleguide/property/object-property-type';
import { Property } from '../styleguide/property/property';
import { PropertyValue } from './property-value';

export class TypedValueStore {
	private property: Property | undefined;

	@MobX.observable protected selectedTypeId: string | undefined;

	@MobX.observable
	protected typedValues: Map<string | undefined, PropertyValue | PropertyValueProxy> = new Map();

	public getProperty(): Property | undefined {
		return this.property;
	}

	public getSelectedTypeId(): string | undefined {
		return this.selectedTypeId;
	}

	public getValue(typeId?: string): PropertyValue {
		const value = this.typedValues.get(typeId);

		if (!(value instanceof PropertyValueProxy)) {
			return value;
		}

		const values = value.getValues();

		const objectValue = Array.from(values.keys()).reduce((accumulated, propertyId) => {
			const valueStore = value.getTypedValueStore(propertyId);

			const propertyWrapper = valueStore && {
				[propertyId]: valueStore.getValue(valueStore.getSelectedTypeId())
			};

			return { accumulated, ...propertyWrapper };
		}, {});

		return objectValue;
	}

	public setProperty(property?: Property): void {
		this.property = property;
	}

	public setSelectedTypeId(typeId?: string): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(value: any, typeId?: string): void {
		const propertyType = this.property && typeId && this.property.getType(typeId);

		if (!propertyType) {
			console.warn('setting raw value for unknown property type');
			this.setValueOrCreateProxy(value, typeId);
			return;
		}

		const coercedValue = propertyType.coerceValue(value);
		this.setValueOrCreateProxy(coercedValue, typeId);
	}

	// tslint:disable-next-line:no-any
	protected setValueOrCreateProxy(value: PropertyValue, typeId?: string): void {
		if (typeof value !== 'object') {
			this.typedValues.set(typeId, value);
		}

		const propertyType = this.property && typeId && this.property.getType(typeId);
		const proxy = new PropertyValueProxy();
		const objectPropertyType = propertyType as ObjectPropertyType | undefined;
		proxy.setContext(objectPropertyType);

		this.typedValues.set(typeId, proxy);
	}
}

export class PropertyValueProxy {
	private context: ObjectPropertyType | undefined;

	@MobX.observable protected propertyValues: Map<string, TypedValueStore> = new Map();

	public getContext(): ObjectPropertyType | undefined {
		return this.context;
	}

	public getTypedValueStore(propertyId: string): TypedValueStore | undefined {
		return this.propertyValues.get(propertyId);
	}

	public getValue(propertyId: string, typeId?: string): PropertyValue {
		const typedValueStore = this.propertyValues.get(propertyId);
		return typedValueStore && typedValueStore.getValue(typeId);
	}

	public getValues(): ReadonlyMap<string, TypedValueStore | undefined> {
		return this.propertyValues;
	}

	public setContext(context?: ObjectPropertyType): void {
		this.context = context;
	}

	// tslint:disable-next-line:no-any
	public setValue(propertyId: string, value: any, typeId?: string): void {
		let typedValueStore = this.propertyValues.get(propertyId);

		if (!typedValueStore) {
			typedValueStore = new TypedValueStore();
			typedValueStore.setProperty(this.context && this.context.getProperty(propertyId));
			this.propertyValues.set(propertyId, typedValueStore);
		}

		typedValueStore.setValue(value, typeId);
	}
}
