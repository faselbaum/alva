import * as deepAssign from 'deep-assign';
import * as MobX from 'mobx';
import * as ObjectPath from 'object-path';
import { Property } from '../styleguide/property/property';
import { PropertyValue } from './property-value';

export class PropertyValueProxy {
	private property: Property | undefined;

	@MobX.observable private propertyValues: Map<string | undefined, PropertyValue> = new Map();

	@MobX.observable private selectedTypeId: string | undefined;

	public getProperty(): Property | undefined {
		return this.property;
	}

	public getSelectedTypeId(): string | undefined {
		return this.selectedTypeId;
	}

	public getValue(typeId: string, path: string): PropertyValue {
		const value: PropertyValue = this.propertyValues.get(typeId);

		if (!path) {
			return value;
		}

		return ObjectPath.get(value as {}, path);
	}

	public setProperty(property?: Property): void {
		this.property = property;
	}

	public setSelectedTypeId(typeId: string | undefined): void {
		this.selectedTypeId = typeId;
	}

	// tslint:disable-next-line:no-any
	public setValue(value: any, typeId: string, path: string): void {
		// tslint:disable-next-line:no-any
		let coercedValue: any;

		if (this.property && typeId) {
			coercedValue = this.property.getSupportedTypes()[typeId].coerceValue(value);
		} else {
			coercedValue = value;
		}

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
