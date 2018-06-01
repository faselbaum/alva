import * as Electron from 'electron';
import { HtmlExporter } from '../server/export/html-exporter';
import { ServerMessageType } from '../message';
import { AlvaApp, EditHistory, Project } from '../model';
import { PdfExporter } from '../server/export/pdf-exporter';
import { PngExporter } from '../server/export/png-exporter';
import { SketchExporter } from '../server/export/sketch-exporter';
import { Sender } from '../message/server';
import { ViewStore } from '../store';
import * as Types from '../model/types';
import * as uuid from 'uuid';

interface PathQuery {
	defaultName: string;
	extname: string;
	title: string;
	typeName: string;
}

// tslint:disable-next-line promise-function-async
function queryPath(options: PathQuery): Promise<string> {
	return new Promise((resolve, reject) => {
		Electron.dialog.showSaveDialog(
			{
				title: options.title,
				defaultPath: `${options.defaultName}.${options.extname}`,
				filters: [{ name: options.typeName, extensions: [options.extname] }]
			},
			resolve
		);
	});
}

export function createApplicationMenu(
	ctx: Types.MenuContext,
	{ sender }: { sender: Sender }
): void {
	const alvaApp = AlvaApp.from(ctx.app);
	const store = new ViewStore({ app: alvaApp, history: new EditHistory() });
	const project = ctx.project ? Project.from(ctx.project) : undefined;
	const selectedElement = project ? project.getElements().find(e => e.getSelected()) : undefined;

	if (project) {
		store.setProject(project);
	}

	const page = store.getCurrentPage();
	const patternLibrary = store.getPatternLibrary();

	const template: Electron.MenuItemConstructorOptions[] = [
		{
			label: '&File',
			submenu: [
				{
					label: '&New',
					accelerator: 'CmdOrCtrl+N',
					click: () => {
						sender.send({
							type: ServerMessageType.CreateNewFileRequest,
							id: uuid.v4(),
							payload: undefined
						});
					}
				},
				{
					label: '&Open',
					accelerator: 'CmdOrCtrl+O',
					click: () => {
						sender.send({
							type: ServerMessageType.OpenFileRequest,
							id: uuid.v4(),
							payload: undefined
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'New &Page',
					enabled: typeof project !== 'undefined',
					accelerator: 'CmdOrCtrl+Shift+N',
					click: () => {
						sender.send({
							type: ServerMessageType.CreateNewPage,
							id: uuid.v4(),
							payload: undefined
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: '&Save',
					enabled: typeof project !== 'undefined',
					accelerator: 'CmdOrCtrl+S',
					role: 'save',
					click: () => {
						if (!project) {
							return;
						}

						sender.send({
							type: ServerMessageType.Save,
							id: uuid.v4(),
							payload: {
								path: project.getPath(),
								project: project.toJSON()
							}
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: '&Export',
					submenu: [
						{
							label: 'Export Page as Sketch',
							enabled: typeof page !== 'undefined',
							click: async () => {
								if (!page) {
									return;
								}

								const path = await queryPath({
									title: 'Export Sketch as',
									typeName: 'Almost Sketch JSON',
									defaultName: `${page.getName()}.asketch`,
									extname: 'json'
								});

								if (path) {
									const sketchExporter = new SketchExporter(store);
									sketchExporter.execute(path);
								}
							}
						},
						{
							label: 'Export Page as PDF',
							enabled: typeof page !== 'undefined',
							click: async () => {
								if (!page) {
									return;
								}

								const path = await queryPath({
									title: 'Export PDF as',
									typeName: 'PDF Document',
									defaultName: page.getName(),
									extname: 'pdf'
								});

								if (path) {
									const pdfExporter = new PdfExporter(store);
									pdfExporter.execute(path);
								}
							}
						},
						{
							label: 'Export Page as PNG',
							enabled: typeof page !== 'undefined',
							click: async () => {
								if (!page) {
									return;
								}

								const path = await queryPath({
									title: 'Export PNG as',
									typeName: 'PNG Image',
									defaultName: page.getName(),
									extname: 'png'
								});

								if (path) {
									const pngExporter = new PngExporter(store);
									pngExporter.execute(path);
								}
							}
						},
						{
							type: 'separator'
						},
						{
							label: 'Export Project as HTML',
							enabled: typeof project !== 'undefined',
							click: async () => {
								if (!project) {
									return;
								}

								const path = await queryPath({
									title: 'Export HTML as',
									typeName: 'HTML File',
									defaultName: project.getName(),
									extname: 'html'
								});

								if (path) {
									const htmlExporter = new HtmlExporter(store);
									htmlExporter.execute(path);
								}
							}
						}
					]
				},
				{
					type: 'separator',
					visible: process.platform !== 'darwin'
				},
				{
					type: 'separator',
					visible: process.platform !== 'darwin'
				},
				{
					label: '&Close',
					accelerator: 'CmdOrCtrl+W',
					role: 'close'
				}
			]
		},
		{
			label: '&Edit',
			submenu: [
				{
					label: '&Undo',
					accelerator: 'CmdOrCtrl+Z',
					enabled: typeof project !== 'undefined',
					click: () =>
						sender.send({
							id: uuid.v4(),
							type: ServerMessageType.Undo,
							payload: undefined
						})
				},
				{
					label: '&Redo',
					accelerator: 'Shift+CmdOrCtrl+Z',
					enabled: typeof project !== 'undefined',
					click: () =>
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Redo
						})
				},
				{
					type: 'separator'
				},
				{
					label: '&Cut',
					enabled: typeof project !== 'undefined',
					accelerator: 'CmdOrCtrl+X',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Cut
						});
						Electron.Menu.sendActionToFirstResponder('cut:');
					}
				},
				{
					label: 'C&opy',
					enabled: typeof project !== 'undefined',
					accelerator: 'CmdOrCtrl+C',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Copy
						});
						Electron.Menu.sendActionToFirstResponder('copy:');
					}
				},
				{
					label: '&Paste',
					enabled: typeof project !== 'undefined',
					accelerator: 'CmdOrCtrl+V',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Paste
						});
						Electron.Menu.sendActionToFirstResponder('paste:');
					}
				},
				{
					type: 'separator'
				},
				{
					label: '&Duplicate',
					enabled: typeof selectedElement !== 'undefined' || typeof page !== 'undefined',
					accelerator: 'CmdOrCtrl+D',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Duplicate
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: '&Select All',
					accelerator: 'CmdOrCtrl+A',
					role: 'selectall'
				},
				{
					type: 'separator'
				},
				{
					label: '&Delete',
					enabled: typeof project !== 'undefined',
					accelerator: process.platform === 'darwin' ? 'Backspace' : 'Delete',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.Delete
						});
						Electron.Menu.sendActionToFirstResponder('delete:');
					}
				}
			]
		},
		{
			label: '&Library',
			submenu: [
				{
					label: getLibraryLabel(project),
					enabled: typeof patternLibrary !== 'undefined',
					accelerator: 'CmdOrCtrl+Shift+C',
					click: () => {
						if (!project) {
							return;
						}

						sender.send({
							type: ServerMessageType.ConnectPatternLibraryRequest,
							id: uuid.v4(),
							payload: project.toJSON()
						});
					}
				},
				{
					label: '&Update',
					enabled:
						typeof patternLibrary !== 'undefined' &&
						patternLibrary.getState() === Types.PatternLibraryState.Connected,
					accelerator: 'CmdOrCtrl+U',
					click: () => {
						if (!project) {
							return;
						}

						sender.send({
							type: ServerMessageType.UpdatePatternLibraryRequest,
							id: uuid.v4(),
							payload: project.toJSON()
						});
					}
				}
			]
		},
		{
			label: '&View',
			submenu: [
				{
					label: '&Reload',
					accelerator: 'CmdOrCtrl+R',
					click: (item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) => {
						if (focusedWindow) {
							focusedWindow.reload();
						}
					}
				},
				{
					label: 'Toggle &Full Screen',
					accelerator: (() => {
						if (process.platform === 'darwin') {
							return 'Ctrl+Command+F';
						} else {
							return 'F11';
						}
					})(),
					click: (item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) => {
						if (focusedWindow) {
							focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
						}
					}
				},
				{
					label: 'Toggle &Developer Tools',
					accelerator: (() => {
						if (process.platform === 'darwin') {
							return 'Alt+Command+I';
						} else {
							return 'Ctrl+Shift+I';
						}
					})(),
					click: (item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) => {
						if (focusedWindow) {
							focusedWindow.webContents.toggleDevTools();
						}
					}
				}
			]
		},
		{
			label: '&Window',
			role: 'window',
			submenu: [
				{
					label: '&Minimize',
					accelerator: 'CmdOrCtrl+M',
					role: 'minimize'
				}
			]
		},
		{
			label: '&Help',
			role: 'help',
			submenu: [
				{
					label: '&Github'
				},
				{
					label: '&Quickstart'
				},
				{
					label: '&Feedback'
				},
				{
					label: '&Learn More',
					click: () => {
						Electron.shell.openExternal('https://meetalva.io/');
					}
				}
			]
		}
	];

	if (process.platform === 'darwin') {
		const name = Electron.app.getName();
		template.unshift({
			label: name,
			submenu: [
				{
					label: 'About ' + name,
					role: 'about'
				},
				{
					label: 'Check for Updates',
					click: () => {
						sender.send({
							id: uuid.v4(),
							payload: undefined,
							type: ServerMessageType.CheckForUpdatesRequest
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Services',
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: 'Hide ' + name,
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: 'Hide Others',
					accelerator: 'Command+Shift+H',
					role: 'hideothers'
				},
				{
					label: 'Show All',
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					role: 'quit'
				}
			]
		});
		const windowMenu = template.find(m => m.role === 'window');
		if (windowMenu) {
			windowMenu.submenu &&
				(windowMenu.submenu as Electron.MenuItemConstructorOptions[]).push(
					{
						type: 'separator'
					},
					{
						label: 'Bring All to Front',
						role: 'front'
					}
				);
		}
	}

	Electron.Menu.setApplicationMenu(Electron.Menu.buildFromTemplate(template));
}

function getLibraryLabel(project: Project | undefined): string {
	if (!project) {
		return '&Connect';
	}

	const library = project.getPatternLibrary();

	switch (library.getState()) {
		case Types.PatternLibraryState.Pristine:
			return '&Connect';
		case Types.PatternLibraryState.Connected:
			return '&Change';
		case Types.PatternLibraryState.Disconnected:
			return 'Re&connect';
	}
}
