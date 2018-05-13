import { AssetItem } from '../../lsg/patterns/property-items/asset-item';
import { AssetPropertyType } from '../../store/styleguide/property/asset-property-type';
import { BooleanItem } from '../../lsg/patterns/property-items/boolean-item';
import { BooleanPropertyType } from '../../store/styleguide/property/boolean-property-type';
import { remote } from 'electron';
import Element from '../../lsg/patterns/element';
import { EnumItem, Values } from '../../lsg/patterns/property-items/enum-item';
import { EnumPropertyType, Option } from '../../store/styleguide/property/enum-property-type';
import * as MobX from 'mobx';
import { observer } from 'mobx-react';
import { ObjectPropertyType } from '../../store/styleguide/property/object-property-type';
import { PageElement } from '../../store/page/page-element';
import { Property } from '../../store/styleguide/property/property';
import { PropertyItem } from '../../lsg/patterns/property-item';
import { PropertyValue } from '../../store/page/property-value';
import { PropertyValueCommand } from '../../store/command/property-value-command';
import { PropertyValueProxy } from '../../store/page/property-value-proxy';
import * as React from 'react';
import { Store } from '../../store/store';
import { StringItem } from '../../lsg/patterns/property-items/string-item';
import { StringPropertyType } from '../../store/styleguide/property/string-property-type';

interface PropertyTreeProps {
	element: PageElement;
	propertyId?: string;
	propertyValueProxy: PropertyValueProxy;
	typeContext?: ObjectPropertyType;
}

@observer
class PropertyTree extends React.Component<PropertyTreeProps> {
	@MobX.observable protected isOpen = false;
	protected lastCommand: PropertyValueCommand;

	protected convertOptionsToValues(options: Option[]): Values[] {
		return options.map(option => ({
			id: option.getId(),
			name: option.getName()
		}));
	}

	protected handleBlur(): void {
		if (this.lastCommand) {
			this.lastCommand.seal();
		}
	}

	// tslint:disable-next-line:no-any
	protected handleChange(
		property: Property,
		value: PropertyValue,
		propertyValueProxy: PropertyValueProxy,
		typeId: string
	): void {
		this.lastCommand = new PropertyValueCommand(
			value,
			this.props.element,
			propertyValueProxy,
			property.getId(),
			typeId
		);
		Store.getInstance().execute(this.lastCommand);
	}

	protected handleChooseAsset(
		property: Property,
		propertyValueProxy: PropertyValueProxy,
		typeId: string
	): void {
		remote.dialog.showOpenDialog(
			{
				title: 'Select an image',
				properties: ['openFile']
			},
			filePaths => {
				if (filePaths && filePaths.length) {
					const dataUrl = AssetPropertyType.getValueFromFile(filePaths[0]);
					this.handleChange(property, dataUrl, propertyValueProxy, typeId);
				}
			}
		);
	}

	protected handleClick(): void {
		this.isOpen = !this.isOpen;
	}

	public render(): React.ReactNode {
		const { typeContext, propertyId } = this.props;

		if (!propertyId) {
			return this.renderItems();
		}

		const property = typeContext && typeContext.getProperty(propertyId);
		if (!property) {
			return;
		}

		return (
			<Element
				dragging={false}
				title={property.getName()}
				open={this.isOpen}
				onClick={this.handleClick}
			>
				{this.isOpen ? this.renderItems() : 'hidden'}
			</Element>
		);
	}

	protected renderItems(): React.ReactNode {
		const { typeContext, propertyValueProxy } = this.props;
		const properties = typeContext && typeContext.getProperties();

		if (!properties) {
			return <div>This element has no properties</div>;
		}

		return <>{properties.map(property => this.renderProperty(property, propertyValueProxy))}</>;
	}

	protected renderProperty(
		property: Property,
		propertyValueProxy: PropertyValueProxy
	): React.ReactNode {
		const id = property.getId();
		const typedValueStore = propertyValueProxy.getValueStore(id);
		const selectedTypeId = typedValueStore
			? typedValueStore.getSelectedTypeId() || property.getSupportedTypes()[0].getId()
			: property.getSupportedTypes()[0].getId();
		const name = property.getName();
		const type = property.getType(selectedTypeId);

		const value = typedValueStore
			? typedValueStore.getValue(selectedTypeId)
			: property.getDefaultValue();

		const propTypes = property.getSupportedTypes().map(supportedType => ({
			id: supportedType.getId(),
			name: supportedType.getName()
		}));

		let propertyControl: React.ReactNode;

		if (type instanceof BooleanPropertyType) {
			propertyControl = (
				<BooleanItem
					checked={value as boolean}
					onChange={event =>
						this.handleChange(property, !value, propertyValueProxy, selectedTypeId)
					}
				/>
			);
		} else if (type instanceof StringPropertyType) {
			propertyControl = (
				<StringItem
					value={value as string}
					onChange={event =>
						this.handleChange(
							property,
							event.currentTarget.value,
							propertyValueProxy,
							selectedTypeId
						)
					}
					onBlur={event => this.handleBlur()}
				/>
			);
		} else if (type instanceof EnumPropertyType) {
			const options = (type as EnumPropertyType).getOptions();
			const option: Option | undefined = (type as EnumPropertyType).getOptionById(
				value as string
			);

			propertyControl = (
				<EnumItem
					selectedValue={option && option.getId()}
					values={this.convertOptionsToValues(options)}
					onChange={event =>
						this.handleChange(
							property,
							event.currentTarget.value,
							propertyValueProxy,
							selectedTypeId
						)
					}
				/>
			);
		} else if (type instanceof AssetPropertyType) {
			const src = value as string | undefined;
			propertyControl = (
				<AssetItem
					inputValue={src && !src.startsWith('data:') ? src : ''}
					imageSrc={src}
					onInputChange={event =>
						this.handleChange(
							property,
							event.currentTarget.value,
							propertyValueProxy,
							selectedTypeId
						)
					}
					onChooseClick={event =>
						this.handleChooseAsset(property, propertyValueProxy, selectedTypeId)
					}
					onClearClick={event =>
						this.handleChange(property, undefined, propertyValueProxy, selectedTypeId)
					}
				/>
			);
		} else if (type instanceof ObjectPropertyType) {
			const objectPropertyType = type as ObjectPropertyType;
			const existingChildProxy =
				typedValueStore &&
				(typedValueStore.getValue(selectedTypeId) as PropertyValueProxy | undefined);

			let childProxy: PropertyValueProxy;

			if (existingChildProxy) {
				childProxy = existingChildProxy;
			} else {
				childProxy = new PropertyValueProxy();
				propertyValueProxy.setContext(objectPropertyType);
			}

			propertyControl = (
				<PropertyTree
					propertyId={id}
					propertyValueProxy={childProxy}
					typeContext={objectPropertyType}
					element={this.props.element}
				/>
			);
		} else {
			propertyControl = <div key={id}>Unknown type: {selectedTypeId}</div>;
		}

		return (
			<PropertyItem
				key={id}
				propertyName={name}
				selectedPropertyType={selectedTypeId}
				propertyTypes={propTypes}
			>
				{propertyControl}
			</PropertyItem>
		);
	}
}

@observer
export class PropertyList extends React.Component {
	public render(): React.ReactNode {
		const selectedElement = Store.getInstance().getSelectedElement();

		if (!selectedElement) {
			return <div>No Element selected</div>;
		}

		const pattern = selectedElement.getPattern();
		const typeContext = pattern && pattern.getProperties();
		const proxy = selectedElement.getPropertyValueProxy();

		return (
			<PropertyTree
				typeContext={typeContext}
				propertyValueProxy={proxy}
				element={selectedElement}
			/>
		);
	}
}
