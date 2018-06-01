import { setSearch } from '../../alva-util';
import { PreviewFrame, PreviewPane } from '../../components';
import * as React from 'react';
import * as Types from '../../model/types';

export interface PreviewPaneProps {
	previewFrame: string;
}

export class PreviewPaneWrapper extends React.Component<PreviewPaneProps> {
	public render(): JSX.Element {
		const { props } = this;

		return (
			<PreviewPane>
				<PreviewFrame
					src={setSearch(props.previewFrame, { mode: Types.PreviewDocumentMode.Live })}
					offCanvas={false}
				/>
			</PreviewPane>
		);
	}
}
