// tslint:disable:no-bitwise

import { AssetPropertyType } from '../../../store/styleguide/property/asset-property-type';
import { BooleanPropertyType } from '../../../store/styleguide/property/boolean-property-type';
import { EnumPropertyType, Option } from '../../../store/styleguide/property/enum-property-type';
import { NumberPropertyType } from '../../../store/styleguide/property/number-property-type';
import { ObjectPropertyType } from '../../../store/styleguide/property/object-property-type';
import { Property } from '../../../store/styleguide/property/property';
import { StringPropertyType } from '../../../store/styleguide/property/string-property-type';
import * as ts from 'typescript';
import { TypescriptUtils } from '../typescript/typescript-utils';

interface PropertyFactoryArgs {
	symbol: ts.Symbol;
	type: ts.Type;
	typechecker: ts.TypeChecker;
}

type PropertyFactory = (args: PropertyFactoryArgs) => Property | undefined;

/**
 * A utility to analyze the Props types of components (like React components) and to map them to
 * Alva supported pattern properties.
 */
export class PropertyAnalyzer {
	private static PROPERTY_FACTORIES: PropertyFactory[] = [
		PropertyAnalyzer.createBooleanProperty,
		PropertyAnalyzer.createEnumProperty,
		PropertyAnalyzer.createStringProperty,
		PropertyAnalyzer.createNumberProperty,
		PropertyAnalyzer.createArrayProperty,
		PropertyAnalyzer.createObjectProperty
	];

	/**
	 * Analyzes a given Props type and returns all Alva-supported properties found.
	 * @param type The TypeScript Props type.
	 * @param typechecker The type checker used when creating the type.
	 * @return The Alva-supported properties.
	 */
	public static analyze(type: ts.Type, typechecker: ts.TypeChecker): Property[] {
		const properties: Property[] = [];
		const members = type.getApparentProperties();

		members.forEach(memberSymbol => {
			if ((memberSymbol.flags & ts.SymbolFlags.Property) !== ts.SymbolFlags.Property) {
				return;
			}

			const property = this.analyzeProperty(memberSymbol, typechecker);
			if (property) {
				properties.push(property);
			}
		});

		return properties;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a Alva-supported property.
	 * On success, returns a new property instance.
	 * @param symbol The TypeScript symbol to analyze (a Props property or subproperty).
	 * @param typechecker The type checker used when creating the symbol's type.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	protected static analyzeProperty(
		symbol: ts.Symbol,
		typechecker: ts.TypeChecker
	): Property | undefined {
		const declaration = TypescriptUtils.findTypeDeclaration(symbol) as ts.Declaration;

		let type = symbol.type
			? symbol.type
			: declaration && typechecker.getTypeAtLocation(declaration);

		if (!type) {
			return;
		}

		if (type.flags & ts.TypeFlags.Union) {
			type = (type as ts.UnionType).types[0];
		}

		for (const propertyFactory of this.PROPERTY_FACTORIES) {
			const property: Property | undefined = propertyFactory({ symbol, type, typechecker });
			if (property) {
				this.setPropertyMetaData(property, symbol);
				return property;
			}
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a array property.
	 * On success, returns a new array property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createArrayProperty(args: PropertyFactoryArgs): Property | undefined {
		if (args.typechecker.isArrayLikeType(args.type)) {
			const arrayType: ts.GenericType = args.type as ts.GenericType;

			if (!arrayType.typeArguments) {
				return;
			}

			const itemType = arrayType.typeArguments[0];
			console.log('Found array type with item type: ', itemType);
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a boolean property.
	 * On success, returns a new boolean property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createBooleanProperty(args: PropertyFactoryArgs): Property | undefined {
		if (
			(args.type.flags & ts.TypeFlags.BooleanLiteral) === ts.TypeFlags.BooleanLiteral ||
			(args.type.symbol && args.type.symbol.name === 'Boolean')
		) {
			const booleanPropertyType = new BooleanPropertyType();
			const property = new Property(args.symbol.name);
			property.addSupportedType(booleanPropertyType);
			return property;
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a enum property.
	 * On success, returns a new enum property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createEnumProperty(args: PropertyFactoryArgs): Property | undefined {
		if (args.type.flags & ts.TypeFlags.EnumLiteral) {
			if (!(args.type.symbol && args.type.symbol.flags & ts.SymbolFlags.EnumMember)) {
				return;
			}

			const enumMemberDeclaration = TypescriptUtils.findTypeDeclaration(args.type.symbol);
			if (!enumMemberDeclaration || !enumMemberDeclaration.parent) {
				return;
			}

			const enumDeclaration = enumMemberDeclaration.parent;
			if (!ts.isEnumDeclaration(enumDeclaration)) {
				return;
			}

			const options: Option[] = enumDeclaration.members.map((enumMember, index) => {
				const enumMemberId = enumMember.name.getText();
				let enumMemberName = PropertyAnalyzer.getJsDocValue(enumMember, 'name');
				if (enumMemberName === undefined) {
					enumMemberName = enumMemberId;
				}
				const enumMemberOrdinal: number = enumMember.initializer
					? parseInt(enumMember.initializer.getText(), 10)
					: index;

				return new Option(enumMemberId, enumMemberName, enumMemberOrdinal);
			});

			const enumPropertyType = new EnumPropertyType(enumDeclaration.name.getText());
			enumPropertyType.setOptions(options);
			const property = new Property(args.symbol.name);
			property.addSupportedType(enumPropertyType);
			return property;
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a number property.
	 * On success, returns a new number property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createNumberProperty(args: PropertyFactoryArgs): Property | undefined {
		if ((args.type.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
			const numberPropertyType = new NumberPropertyType();
			const property = new Property(args.symbol.name);
			property.addSupportedType(numberPropertyType);
			return property;
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a object property.
	 * On success, returns a new object property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createObjectProperty(args: PropertyFactoryArgs): Property | undefined {
		if (args.type.flags & ts.TypeFlags.Object) {
			const objectType = args.type as ts.ObjectType;

			if (objectType.objectFlags & ts.ObjectFlags.Interface) {
				const typeSymbol = args.type.aliasSymbol || args.type.symbol;
				const typeName = typeSymbol && typeSymbol.name;

				const objectPropertyType = new ObjectPropertyType(typeName);
				const property = new Property(args.symbol.name);
				objectPropertyType.setPropertyResolver(() =>
					PropertyAnalyzer.analyze(args.type, args.typechecker)
				);
				property.addSupportedType(objectPropertyType);
				return property;
			}
		}

		return;
	}

	/**
	 * Analyzes a TypeScript symbol and tries to interpret it as a string property.
	 * On success, returns a new string property instance.
	 * @param args The property ID to use, the TypeScript symbol, the TypeScript type, and the type
	 * checker.
	 * @return The Alva-supported property or undefined, if the symbol is not supported.
	 */
	private static createStringProperty(args: PropertyFactoryArgs): Property | undefined {
		if ((args.type.flags & ts.TypeFlags.String) === ts.TypeFlags.String) {
			const property = new Property(args.symbol.name);

			if (PropertyAnalyzer.getJsDocValueFromSymbol(args.symbol, 'asset') !== undefined) {
				const assetPropertyType = new AssetPropertyType();
				property.addSupportedType(assetPropertyType);
			} else {
				const stringPropertyType = new StringPropertyType();
				property.addSupportedType(stringPropertyType);
			}

			return property;
		}

		return;
	}

	/**
	 * Searches a TypeScript AST (syntactic) node for a named JSDoc tag, and returns its value if
	 * found. This is used to read Alva declaration annotations.
	 * @param node The node to scan.
	 * @param tagName The JsDoc tag name, or undefined if the tag has not been found.
	 */
	private static getJsDocValue(node: ts.Node, tagName: string): string | undefined {
		const jsDocTags: ReadonlyArray<ts.JSDocTag> | undefined = ts.getJSDocTags(node);
		let result: string | undefined;
		if (jsDocTags) {
			jsDocTags.forEach(jsDocTag => {
				if (jsDocTag.tagName && jsDocTag.tagName.text === tagName) {
					if (result === undefined) {
						result = '';
					}
					result += ` ${jsDocTag.comment}`;
				}
			});
		}

		return result !== undefined ? result.trim() : undefined;
	}

	/**
	 * Searches a TypeScript type-checker (semantic) symbol for a named JSDoc tag, and returns its
	 * value if found. This is used to read Alva declaration annotations.
	 * @param node The node to scan.
	 * @param tagName The JsDoc tag name, or undefined if the tag has not been found.
	 */
	private static getJsDocValueFromSymbol(symbol: ts.Symbol, tagName: string): string | undefined {
		const jsDocTags = symbol.getJsDocTags();
		let result: string | undefined;
		if (jsDocTags) {
			jsDocTags.forEach(jsDocTag => {
				if (jsDocTag.name === tagName) {
					if (result === undefined) {
						result = '';
					}
					result += ` ${jsDocTag.text}`;
				}
			});
		}

		return result !== undefined ? result.trim() : undefined;
	}

	/**
	 * Updates a created property from the meta-data found in the declaration file, such as required
	 * flag, name-override, and default value.
	 * @param property The property to enrich
	 * @param symbol The TypeScript symbol of the Props property.
	 */
	private static setPropertyMetaData(property: Property, symbol: ts.Symbol): void {
		property.setRequired((symbol.flags & ts.SymbolFlags.Optional) !== ts.SymbolFlags.Optional);

		const nameOverride = PropertyAnalyzer.getJsDocValueFromSymbol(symbol, 'name');
		if (nameOverride) {
			property.setName(nameOverride);
		}

		const defaultValue = PropertyAnalyzer.getJsDocValueFromSymbol(symbol, 'default');
		if (defaultValue) {
			property.setDefaultValue(defaultValue);
		}
	}
}
