import { Color } from '../../colors';
import { Icon, IconName, IconSize } from '../../icons';
import { PropertyDescription } from '../property-description';
import { PropertyLabel } from '../property-label';
import * as React from 'react';
import { getSpace, SpaceSize } from '../../space';
import styled from 'styled-components';

export interface BooleanItemProps {
	checked?: boolean;
	className?: string;
	description?: string;
	label: string;
	onChange?: React.ChangeEventHandler<HTMLElement>;
}

interface IndicatorProps {
	checked?: boolean;
}

const StyledBooleanItem = styled.label`
	display: block;
	margin-bottom: ${getSpace(SpaceSize.S)}px;
`;

const StyledContainer = styled.div`
	display: flex;
	width: 100%;
	box-sizing: border-box;
`;

const indicatorWidth = 48;
const indicatorHeight = 30;

const StyledIndicatorKnob = styled.div`
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	width: ${indicatorHeight}px;
	height: ${indicatorHeight}px;
	margin: -1px 0 0 -1px;
	transform: translateX(0);
	border-radius: 100%;
	background: ${Color.White};
	transition: transform 0.1s, border-color 0.1s, box-shadow 0.1s;
	box-sizing: border-box;
	border: 1px solid ${Color.Grey60};
	@media screen and (-webkit-min-device-pixel-ratio: 2) {
		border-width: 0.5px;
	}

	${(props: IndicatorProps) =>
		props.checked
			? `
		transform: translateX(${indicatorWidth - indicatorHeight}px);
		background: ${Color.White};
		border-color: ${Color.Blue40};
	`
			: ''};
`;

const StyledIndicator = styled.span`
	position: relative;
	display: inline-block;
	width: ${indicatorWidth}px;
	height: ${indicatorHeight}px;
	border-radius: ${indicatorHeight / 2}px;
	box-sizing: border-box;
	border: 1px solid ${Color.Grey80};
	transition: background 0.1s, box-shadow 0.1s;
	user-select: none;

	&:hover {
		${StyledIndicatorKnob} {
			border-color: ${Color.Grey60};
			box-shadow: 0.5px 0.5px 3px ${Color.Grey60};

			${(props: IndicatorProps) =>
				props.checked
					? `
				border-color: ${Color.Blue40};
				box-shadow: 0.5px 0.5px 3px ${Color.Blue40};
			`
					: ''};
		}
	}

	${(props: IndicatorProps) =>
		props.checked
			? `
		background: ${Color.Blue80};
		border-color: ${Color.Blue40};
	`
			: ''};
`;

const StyledIcon = styled(Icon)`
	transform: translate(-0.5px, -0.5px); // fix to align icon properly
`;

const StyledInput = styled.input`
	display: none;
`;

export const BooleanItem: React.StatelessComponent<BooleanItemProps> = props => {
	const { className, description, label, checked, onChange } = props;
	const icon = checked ? IconName.Check : IconName.Uncheck;
	const color = checked ? Color.Blue40 : Color.Grey60;

	return (
		<StyledBooleanItem className={className}>
			<StyledContainer>
				<PropertyLabel label={label} />
				<StyledInput onChange={onChange} checked={checked} type="checkbox" />
				<StyledIndicator checked={checked}>
					<StyledIndicatorKnob checked={checked}>
						<StyledIcon name={icon} size={IconSize.XS} color={color} />
					</StyledIndicatorKnob>
				</StyledIndicator>
			</StyledContainer>
			{description && <PropertyDescription description={description || ''} />}
		</StyledBooleanItem>
	);
};
