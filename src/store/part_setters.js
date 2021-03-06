/* Web Lic - Copyright (C) 2018 Remi Gagne */

'use strict';

import _ from '../util';
import store from '../store';
import LDParse from '../LDParse';

export default {
	// opts: {partID, step, direction, partDistance=60, arrowOffset=0, arrowLength=60, arrowRotation=0}
	// If direction == null, remove displacement
	displace(opts) {
		const step = store.get.lookupToItem(opts.step);
		delete opts.step;
		const displacementDistance = 60;
		store.mutations.csi.resetSize({csi: step.csiID});
		opts.partDistance = (opts.partDistance == null) ? displacementDistance : opts.partDistance;
		opts.arrowOffset = (opts.arrowOffset == null) ? 0 : opts.arrowOffset;
		opts.arrowLength = (opts.arrowLength == null) ? displacementDistance : opts.arrowLength;
		opts.arrowRotation = (opts.arrowRotation == null) ? 0 : opts.arrowRotation;
		step.displacedParts = step.displacedParts || [];
		const idx = step.displacedParts.findIndex(p => p.partID === opts.partID);
		if (opts.direction) {
			if (idx >= 0) {
				step.displacedParts[idx].direction = opts.direction;
				step.displacedParts[idx].partDistance = opts.partDistance;
				step.displacedParts[idx].arrowOffset = opts.arrowOffset;
				step.displacedParts[idx].arrowLength = opts.arrowLength;
				step.displacedParts[idx].arrowRotation = opts.arrowRotation;
			} else {
				step.displacedParts.push(opts);
			}
		} else if (idx >= 0) {
			_.pullAt(step.displacedParts, idx);
		}
		// TODO: no need to layout entire page; can layout just the step containing the newly displaced part
		store.mutations.page.layout({page: store.get.pageForItem(step)});
	},
	moveToStep(opts) { // opts: {partID, srcStep, destStep, doLayout = false}
		const srcStep = store.get.lookupToItem(opts.srcStep);
		store.mutations.step.removePart({step: srcStep, partID: opts.partID});
		store.mutations.csi.resetSize({csi: srcStep.csiID});

		const destStep = store.get.lookupToItem(opts.destStep);
		store.mutations.step.addPart({step: destStep, partID: opts.partID});
		store.mutations.csi.resetSize({csi: destStep.csiID});

		if (opts.doLayout) {
			store.mutations.page.layout({page: store.get.pageForItem(srcStep)});
			if (srcStep.parent.id !== destStep.parent.id) {
				store.mutations.page.layout({page: store.get.pageForItem(destStep)});
			}
		}
	},
	addToCallout(opts) {  // opts: {partID, step, callout, doLayout = false}
		const partID = opts.partID;
		const step = store.get.lookupToItem(opts.step);
		const callout = store.get.lookupToItem(opts.callout);
		let destCalloutStep;
		if (_.isEmpty(callout.steps)) {
			destCalloutStep = store.mutations.step.add({dest: callout});
		} else {
			destCalloutStep = store.get.step(_.last(callout.steps));
		}
		destCalloutStep.model = _.cloneDeep(step.model);
		destCalloutStep.parts.push(partID);
		store.mutations.csi.resetSize({csi: destCalloutStep.csiID});
		if (opts.doLayout) {
			store.mutations.page.layout({page: step.parent});
		}
	},
	removeFromCallout(opts) {  // opts: {partID, step}
		const step = store.get.lookupToItem(opts.step);
		_.deleteItem(step.parts, opts.partID);
		store.mutations.csi.resetSize({csi: step.csiID});
		store.mutations.page.layout({page: store.get.pageForItem(step)});
	},
	delete(opts) { // opts: {partID, step, doLayout}
		// Remove part from the step its in and from the model entirely
		const partStep = store.get.lookupToItem(opts.step);
		const model = LDParse.model.get.abstractPart(partStep.model.filename);
		const part = LDParse.model.get.partFromID(opts.partID, model.filename);
		store.mutations.step.removePart(opts);
		store.mutations.inventoryPage.removePart({part, doLayout: opts.doLayout});
		store.state.steps.filter(step => {
			return step.model.filename === model.filename;
		}).map(step => {
			step.parts.forEach((partID, idx) => {
				if (partID > opts.partID) {
					step.parts[idx] -= 1;
				}
			});
		});
	}
};
