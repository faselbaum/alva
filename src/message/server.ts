import { BrowserWindow, ipcMain } from 'electron';
import { isMessage } from './is-message';
import * as uuid from 'uuid';
import { ServerMessage, ServerMessageType } from '.';

export { ServerMessage } from '.';
export * from './is-message';

export type MessageListener = (message: ServerMessage) => void;

export class Sender {
	private listeners: MessageListener[] = [];

	public constructor() {
		// tslint:disable-next-line:no-any
		ipcMain.on('message', (e: any, message: any) => {
			if (!isMessage(message)) {
				return;
			}
			this.listeners.forEach(listener => listener(message));
		});
	}

	public emit(message: ServerMessage): void {
		this.listeners.forEach(listener => listener(message));
	}

	public send(message: ServerMessage): void {
		if (!isMessage(message)) {
			console.warn(`Server tried to send invalid message: ${JSON.stringify(message)}`);
			return;
		}

		BrowserWindow.getAllWindows().forEach(win => win.webContents.send('message', message));
	}

	public receive(handler: MessageListener): void {
		this.listeners.push(handler);
	}

	// tslint:disable-next-line:no-any
	public log(...args: any[]): void {
		this.send({
			type: ServerMessageType.Log,
			id: uuid.v4(),
			payload: args
		});
	}
}
