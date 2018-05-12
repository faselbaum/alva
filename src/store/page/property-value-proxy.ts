import * as deepAssign from 'deep-assign';
import * as MobX from 'mobx';
import * as ObjectPath from 'object-path';
import { Property } from '../styleguide/property/property';
import { PropertyValue } from './property-value';

export class PropertyValueProxy {
	private property: Property;

	@MobX.observable private propertyValues: Map<string, PropertyValue> = new Map();

	@MobX.observable private selectedTypeId: string | undefined;

	public constructor(property: Property) {
		this.property = property;
	}

	public getProperty(): Property {
		return this.property;
	}

	public getSelectedType(): string | undefined {
		return this.selectedTypeId;
	}

	public getValue(typeId: string, path?: string): PropertyValue {
		const value: PropertyValue = this.propertyValues.get(typeId);

		if (!path) {
			return value;
		}

		return ObjectPath.get(value as {}, path);
	}

	public setSelectedType(typeId: string | undefined): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(typeId: string, value: any, path?: string): void {
		const coercedValue = this.property.getSupportedTypes()[typeId].coerceValue(value);
		if (path) {
			const rootPropertyValue = this.propertyValues.get(typeId) || {};
			ObjectPath.set<{}, PropertyValue>(rootPropertyValue, path, coercedValue);
			this.propertyValues.set(typeId, deepAssign({}, rootPropertyValue));
		} else {
			this.propertyValues.set(typeId, coercedValue);
		}
		this.propertyValues.set(typeId, value);
	}
}
