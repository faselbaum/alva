import { isMessage } from './is-message';
import { ServerMessage } from '.';

export { ServerMessage } from '.';
export * from './is-message';

export type MessageListener = (message: ServerMessage) => void;

export class Sender {
	private connection: WebSocket;
	private queue: ServerMessage[] = [];
	private listeners: MessageListener[] = [];

	public constructor(address: string) {
		this.connection = new WebSocket(address);

		this.connection.addEventListener('open', () => {
			this.queue.forEach(message => this.send(message));
			this.queue = [];
		});

		this.connection.addEventListener('message', e => {
			if (!isMessage(e.data)) {
				return;
			}
			this.listeners.forEach(listener => listener(e.data));
		});
	}

	public send(message: ServerMessage): void {
		if (!isMessage(message)) {
			console.warn(`Client tried to send invalid message: ${JSON.stringify(message)}`);
			return;
		}

		if (this.connection.readyState === WebSocket.CONNECTING) {
			this.queue.push(message);
			return;
		}

		this.connection.send(JSON.stringify(message));
	}

	public receive(handler: (message: ServerMessage) => void): void {
		this.listeners.push(handler);
	}
}
