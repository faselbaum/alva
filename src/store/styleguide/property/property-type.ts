import { Store } from '../../store';

export abstract class PropertyType {
	private id: string;
	private name: string;

	public constructor(id: string, name?: string) {
		this.id = id;
		this.name = Store.guessName(id, name);
	}

	// tslint:disable-next-line:no-any
	public abstract coerceValue(value: any): any;

	// tslint:disable-next-line:no-any
	public convertToRender(value: any): any {
		return value;
	}

	public getId(): string {
		return this.id;
	}

	public getName(): string {
		return this.name;
	}
}
