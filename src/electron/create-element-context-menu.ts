import { Sender } from '../message/server';
import * as Electron from 'electron';
import { ServerMessageType } from '../message';
import { Project } from '../model';
import * as Types from '../model/types';
import * as uuid from 'uuid';

export function createElementContexMenu(
	ctx: Types.ElementContextMenuContext,
	{ sender }: { sender: Sender }
): void {
	const project = Project.from(ctx.project);
	const element = project.getElementById(ctx.selectedElementId);

	if (!element) {
		return;
	}

	const defaultPasteItems = [
		{
			label: 'Paste Below',
			enabled: ctx.hasClipobardElement && element.getRole() !== Types.ElementRole.Root,
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.PasteElementBelow,
					payload: element.getId()
				});
			}
		},
		{
			label: 'Paste Inside',
			enabled: ctx.hasClipobardElement && element.acceptsChildren(),
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.PasteElementInside,
					payload: element.getId()
				});
			}
		},
		{
			label: 'Duplicate',
			enabled: element.getRole() !== Types.ElementRole.Root,
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.DuplicateElement,
					payload: element.getId()
				});
			}
		}
	];

	const template: Electron.MenuItemConstructorOptions[] = [
		{
			label: 'Cut',
			enabled: element.getRole() !== Types.ElementRole.Root,
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.CutElement,
					payload: element.getId()
				});
				Electron.Menu.sendActionToFirstResponder('cut:');
			}
		},
		{
			label: 'Copy',
			enabled: element.getRole() !== Types.ElementRole.Root,
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.CopyElement,
					payload: element.getId()
				});
				Electron.Menu.sendActionToFirstResponder('copy:');
			}
		},
		{
			label: 'Delete',
			enabled: element.getRole() !== Types.ElementRole.Root,
			click: () => {
				sender.send({
					id: uuid.v4(),
					type: ServerMessageType.DeleteElement,
					payload: element.getId()
				});
				Electron.Menu.sendActionToFirstResponder('delete:');
			}
		},
		{
			type: 'separator'
		},
		// TODO: Find out why pasting via sendActionToFirstResponder
		// sets the caret to position 0 and overwrites the entire input
		/* {
			label: 'Paste',
			click: () => {
				remote.Menu.sendActionToFirstResponder('paste:');
			}
		} */
		...(!element.getNameEditable() ? defaultPasteItems : [])
	];

	Electron.Menu.buildFromTemplate(template).popup({});
}
