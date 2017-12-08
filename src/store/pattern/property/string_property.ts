import { Property } from '.';

export class StringProperty extends Property {
	public constructor(id: string, name: string, required: boolean) {
		super(id, name, required);
	}

	// tslint:disable-next-line:no-any
	public coerceValue(value: any): any {
		if (value === null || value === undefined || value === '') {
			return '';
		}

		return String(value);
	}

	public getType(): string {
		return 'string';
	}

	public toString(): string {
		return `StringProperty(id="${this.getId()}", required="${this.isRequired()}")`;
	}
}