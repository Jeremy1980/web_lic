'use strict';

import _ from './util';

export const defaultUIState = {
	locale: null,
	dialog: {
		importModel: {
			stepsPerPage: 1,
			useMaxSteps: true,
			firstPageNumber: 1,
			firstStepNumber: 1,
			addStepsForSubmodels: true,
			include: {
				titlePage: false,
				partListPage: false,
				submodelBreakdown: false,
				pli: true
			}
		}
	},
	splitter: 20,
	pliTransforms: {}  // TODO: if scale goes back to 1, don't store it delete it.  Likewise with rotations x|y|z = 0.
};

export let uiState = _.clone(defaultUIState);

export function setState(newState) {
	uiState = _.clone(newState);
}
