import { AssetItem } from '../../lsg/patterns/property-items/asset-item';
import { AssetPropertyType } from '../../store/styleguide/property/asset-property-type';
import { BooleanItem } from '../../lsg/patterns/property-items/boolean-item';
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
import * as React from 'react';
import { Store } from '../../store/store';
import { StringItem } from '../../lsg/patterns/property-items/string-item';

interface ObjectContext {
	path: string;
	property: Property;
	propertyType: ObjectPropertyType;
}

interface PropertyTreeProps {
	context?: ObjectContext;
	element: PageElement;
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

	protected getValue(id: string, path?: string): PropertyValue {
		const fullPath = path ? `${path}.${id}` : id;
		const [rootId, ...propertyPath] = fullPath.split('.');
		return this.props.element.getPropertyValue(rootId, propertyPath.join('.'));
	}

	protected handleBlur(): void {
		if (this.lastCommand) {
			this.lastCommand.seal();
		}
	}

	// tslint:disable-next-line:no-any
	protected handleChange(id: string, value: any, context?: ObjectContext): void {
		const fullPath: string = context ? `${context.path}.${id}` : id;
		const [rootId, ...propertyPath] = fullPath.split('.');
		this.lastCommand = new PropertyValueCommand(
			this.props.element,
			rootId,
			value,
			propertyPath.join('.')
		);
		Store.getInstance().execute(this.lastCommand);
	}

	protected handleChooseAsset(id: string, context?: ObjectContext): void {
		remote.dialog.showOpenDialog(
			{
				title: 'Select an image',
				properties: ['openFile']
			},
			filePaths => {
				if (filePaths && filePaths.length) {
					const dataUrl = AssetPropertyType.getValueFromFile(filePaths[0]);
					this.handleChange(id, dataUrl, context);
				}
			}
		);
	}

	protected handleClick(): void {
		this.isOpen = !this.isOpen;
	}

	public render(): React.ReactNode {
		const { context } = this.props;

		if (!context) {
			return this.renderItems();
		}

		const { property } = context;

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
		const { context, element } = this.props;
		const pattern = element.getPattern();

		const properties = context
			? context.propertyType.getProperties()
			: pattern && pattern.getProperties();

		if (!properties) {
			return <div>This element has no properties</div>;
		}

		return (
			<>
				{properties.map(property => {
					const id = property.getId();
					const name = property.getName();
					const type = property.getSupportedTypes()[0];
					const value = this.getValue(id, context && context.path);

					const propTypes = property.getSupportedTypes().map(supportedType => ({
						id: supportedType.getId(),
						name: supportedType.getName()
					}));

					switch (type.getId()) {
						case 'boolean':
							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType={type.getId()}
									propertyTypes={propTypes}
								>
									<BooleanItem
										key={id}
										checked={value as boolean}
										onChange={event => this.handleChange(id, !value, context)}
									/>
								</PropertyItem>
							);

						case 'string':
							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType=""
									propertyTypes={propTypes}
								>
									<StringItem
										key={id}
										value={value as string}
										onChange={event =>
											this.handleChange(id, event.currentTarget.value, context)
										}
										onBlur={event => this.handleBlur()}
									/>
								</PropertyItem>
							);

						case 'enum':
							const options = (type as EnumPropertyType).getOptions();
							const option: Option | undefined = (type as EnumPropertyType).getOptionById(
								value as string
							);

							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType=""
									propertyTypes={propTypes}
								>
									<EnumItem
										key={id}
										selectedValue={option && option.getId()}
										values={this.convertOptionsToValues(options)}
										onChange={event =>
											this.handleChange(id, event.currentTarget.value, context)
										}
									/>
								</PropertyItem>
							);

						case 'asset':
							const src = value as string | undefined;
							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType=""
									propertyTypes={propTypes}
								>
									<AssetItem
										key={id}
										inputValue={src && !src.startsWith('data:') ? src : ''}
										imageSrc={src}
										onInputChange={event =>
											this.handleChange(id, event.currentTarget.value, context)
										}
										onChooseClick={event => this.handleChooseAsset(id, context)}
										onClearClick={event => this.handleChange(id, undefined, context)}
									/>
								</PropertyItem>
							);

						case 'object':
							const objectPropertyType = type as ObjectPropertyType;
							const newPath = (context && `${context.path}.${id}`) || id;

							const newContext: ObjectContext = {
								path: newPath,
								property,
								propertyType: objectPropertyType
							};

							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType=""
									propertyTypes={propTypes}
								>
									<PropertyTree key={id} context={newContext} element={element} />
								</PropertyItem>
							);

						default:
							return (
								<PropertyItem
									propertyName={name}
									selectedPropertyType=""
									propertyTypes={propTypes}
								>
									<div key={id}>Unknown type: {type}</div>
								</PropertyItem>
							);
					}
				})}
			</>
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

		return <PropertyTree element={selectedElement} />;
	}
}
