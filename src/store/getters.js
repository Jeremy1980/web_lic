/* Web Lic - Copyright (C) 2018 Remi Gagne */

'use strict';

import _ from '../util';
import LDParse from '../LDParse';
import store from '../store';

export default {
	pageCount(includeTitlePage) {
		return store.state.pages.length + (includeTitlePage && store.state.titlePage ? 1 : 0);
	},
	modelName(nice) {
		if (!store.model) {
			return '';
		} else if (store.model.name) {
			return store.model.name;
		}
		const name = store.get.modelFilenameBase();
		if (nice) {
			return _.startCase(name.replace(/\//g, '-').replace(/_/g, ' '));
		}
		return name;
	},
	modelFilename() {
		if (!store.model || !store.model.filename) {
			return '';
		}
		return store.model.filename;
	},
	modelFilenameBase(ext) {
		if (!store.model || !store.model.filename) {
			return '';
		}
		return store.model.filename.split('.')[0] + (ext || '');
	},
	isTitlePage(page) {
		return (page || {}).type === 'titlePage';
	},
	isFirstBasicPage(page) {
		return page && (page.id === store.state.pages[0].id);
	},
	isFirstPage(page) {
		if (!page || page.id == null) {
			return false;
		} else if (page.type === 'templatePage') {
			return true;
		}
		return store.get.isFirstBasicPage(page);
	},
	isLastBasicPage(page) {
		return page && (page.id === _.last(store.state.pages).id);
	},
	isLastPage(page) {
		if (!page || page.id == null || page.type === 'templatePage') {
			return false;
		} else if (page.type === 'titlePage') {
			return store.state.pages.length < 1 && store.state.inventoryPages.length < 1;
		} else if (page.type === 'page') {
			if (store.state.inventoryPages.length > 0) {
				return false;
			}
			return store.get.isLastBasicPage(page);
		} else if (page.type === 'inventoryPage') {
			return page.id === _.last(store.state.inventoryPages).id;
		}
		return false;
	},
	isInventoryPage(page) {
		return (page || {}).type === 'inventoryPage';
	},
	pageList() {
		const s = store.state;
		return [
			s.templatePage,
			s.titlePage,
			...s.pages,
			...s.inventoryPages
		].filter(el => el);
	},
	nextBasicPage(item) {
		const nextPage = store.get.nextPage(item);
		return (!nextPage || nextPage.type !== 'page') ? null : nextPage;
	},
	nextPage(item) {
		const page = store.get.pageForItem(item);
		const pageList = store.get.pageList();
		const idx = pageList.indexOf(page);
		return pageList[idx + 1];
	},
	prevBasicPage(item) {
		const prevPage = store.get.prevPage(item);
		return (!prevPage || prevPage.type !== 'page') ? null : prevPage;
	},
	prevPage(item) {
		const page = store.get.pageForItem(item);
		const pageList = store.get.pageList();
		const idx = pageList.indexOf(page);
		return pageList[idx - 1];
	},
	templatePage() {
		return store.state.templatePage;
	},
	templateForItem(item) {
		const template = store.state.template;
		if (template[item.type]) {
			return template[item.type];
		}
		item = store.get.lookupToItem(item);
		const parent = store.get.parent(item);
		switch (item.type) {
			case 'csi':
				return template[parent.type].csi;
			case 'templatePage':
				return template.page;
			case 'divider':
				return template.page.divider;
			case 'quantityLabel':
				return template[parent.type].quantityLabel;
			case 'numberLabel':
				if (parent.parent && parent.parent.type === 'callout') {
					return template.callout.step.numberLabel;
				} else if (parent.type === 'templatePage') {
					return template.page.numberLabel;
				}
				return template[parent.type].numberLabel;
		}
		return null;
	},
	isTemplatePage(page) {
		return (page || {}).type === 'templatePage';
	},
	titlePage() {
		return store.state.titlePage;
	},
	firstPage() {
		return store.state.pages[0];
	},
	lastPage() {
		return _.last(store.state.pages);
	},
	adjacentStep(step, direction, limitToSubmodel) {
		// 'direction' is one of 'prev' or 'next'
		step = store.get.lookupToItem(step);
		let itemList;
		if (step.parent.type === 'step' || step.parent.type === 'callout') {
			itemList = store.get.parent(step).steps.map(store.get.step);
		}
		let adjacentStep = store.get[direction](step, itemList);
		if (limitToSubmodel && itemList == null) {
			while (
				adjacentStep
				&& (step.model.filename !== adjacentStep.model.filename
					|| step.model.parentStepID !== adjacentStep.model.parentStepID)
			) {
				adjacentStep = store.get[direction](adjacentStep);
			}
		}
		return adjacentStep;
	},
	prevStep(step, limitToSubmodel) {
		return store.get.adjacentStep(step, 'prev', limitToSubmodel);
	},
	nextStep(step, limitToSubmodel) {
		return store.get.adjacentStep(step, 'next', limitToSubmodel);
	},
	part(partID, step) {
		return LDParse.model.get.partFromID(partID, step.model.filename);
	},
	partsInStep(step) {
		step = store.get.lookupToItem(step);
		return (step.parts || []).map(partID => {
			return LDParse.model.get.partFromID(partID, step.model.filename);
		});
	},
	abstractPartsInStep(step) {
		step = store.get.lookupToItem(step);
		const parts = store.get.partsInStep(step);
		return parts.map(part => {
			return LDParse.model.get.abstractPart(part.filename);
		});
	},
	stepHasSubmodel(step) {
		step = store.get.lookupToItem(step);
		const parts = store.get.abstractPartsInStep(step);
		return parts.some(part => part.isSubModel);
	},
	partList(step) {  // Return a list of part IDs for every part in this (and previous) step.
		step = store.get.lookupToItem(step);
		if (step.parts == null) {
			return null;
		}
		let partList = [];
		while (step) {
			if (step.parts) {
				partList = partList.concat(step.parts);
			}
			step = store.get.prevStep(step, true);
		}
		return partList;
	},

	// Given a pli and a part, find a pliItem in the pli that matches the part's filename & color (if any)
	matchingPLIItem(pli, part) {
		pli = store.get.lookupToItem(pli);
		const targets = pli.pliItems.map(store.get.pliItem)
			.filter(i => i.filename === part.filename && i.colorCode === part.colorCode);
		return targets[0];
	},
	pliItemIsSubmodel(pliItem) {
		pliItem = store.get.lookupToItem(pliItem);
		return LDParse.model.isSubmodel(pliItem.filename);
	},
	isMoveable: (() => {
		const moveableItems = [
			'step', 'csi', 'pli', 'pliItem', 'quantityLabel', 'numberLabel', 'annotation',
			'submodelImage', 'callout', 'divider', 'point', 'rotateIcon'
		];
		return function(item) {
			if (store.get.isTemplatePage(store.get.pageForItem(item))) {
				return false;
			}
			return moveableItems.includes(item.type);
		};
	})(),
	prev(item, itemList) {
		// Get the previous item in the specified item's list, based on item.number and matching parent types
		item = store.get.lookupToItem(item);
		itemList = itemList || store.state[item.type + 's'];
		const idx = itemList.findIndex(el => {
			return el.number === item.number - 1 && el.parent.type === item.parent.type;
		});
		return (idx < 0) ? null : itemList[idx];
	},
	next(item, itemList) {
		// Get the next item in the specified item's list, based on item.number and matching parent types
		item = store.get.lookupToItem(item);
		itemList = itemList || store.state[item.type + 's'];
		const idx = itemList.findIndex(el => {
			return el.number === item.number + 1 && el.parent.type === item.parent.type;
		});
		return (idx < 0) ? null : itemList[idx];
	},
	parent(item) {
		item = store.get.lookupToItem(item);
		if (item && item.parent) {
			return store.get.lookupToItem(item.parent);
		}
		return null;
	},
	isDescendent(item, ancestor) {  // Return true if item is a descendent or equal to ancestor
		item = store.get.lookupToItem(item);
		ancestor = store.get.lookupToItem(ancestor);
		while (item) {
			if (_.itemEq(item, ancestor)) {
				return true;
			}
			item = store.get.parent(item);
		}
		return false;
	},
	childList() {
		const children = [
			'annotation', 'callout', 'csi', 'divider',
			'numberLabel', 'rotateIcon', 'step', 'submodelImage'
		];
		if (store.state.plisVisible) {
			children.push('pli');
		}
		return children;
	},
	stepChildren(step) {
		return store.get.children(step, store.get.childList());
	},
	hasChildren(item) {
		item = store.get.lookupToItem(item);
		const possibleChildren = store.get.childList();
		for (let i = 0; i < possibleChildren.length; i++) {
			const childList = item[possibleChildren[i] + 's'];
			if (Array.isArray(childList) && childList.length > 0) {
				return true;
			}
		}
		return false;
	},
	children(item, childTypeList) {
		item = store.get.lookupToItem(item);
		const children = [];
		childTypeList.forEach(childType => {
			const childList = item[childType + 's'];
			const childID = item[childType + 'ID'];
			if (childList && childList.length) {
				children.push(... childList.map(id => store.get[childType](id)));
			} else if (childID != null) {
				children.push(store.get[childType](childID));
			}
		});
		return children;
	},
	pageForItem(item) {
		if (item && item.type === 'part') {
			item = store.get.step(item.stepID);
		}
		item = store.get.lookupToItem(item);
		while (item && item.type && !item.type.toLowerCase().endsWith('page')) {
			item = store.get.parent(item);
		}
		return item;
	},
	// Return list of submodels used in main model, the step they're first used on and how many are used
	submodels() {
		if (!store.model) {
			return [];
		}
		const submodels = [];
		const mainModelFilename = store.model.filename;
		const addedModelNames = new Set([mainModelFilename]);
		store.state.steps.filter(step => {
			return step.parent.type === 'page' && step.model.filename !== mainModelFilename;
		}).forEach(step => {

			if (!addedModelNames.has(step.model.filename)) {
				const modelHierarchy = [{filename: step.model.filename, quantity: 1}];
				let parentStepID = step.model.parentStepID;
				while (parentStepID != null) {
					const parentStep = store.get.step(parentStepID);
					if (parentStep.parts.length > 1) {
						// Check if parent step contains multiple copies of the current submodel;
						// adjust quantity label accordingly
						const partNames = parentStep.parts.map(partID => {
							return LDParse.model.get.partFromID(partID, parentStep.model.filename).filename;
						});
						const count = _.count(partNames, step.model.filename);
						_.last(modelHierarchy).quantity = count;
					}
					modelHierarchy.push({filename: parentStep.model.filename, quantity: 1});
					parentStepID = parentStep.model.parentStepID;
				}
				modelHierarchy.reverse().forEach(entry => {
					if (!addedModelNames.has(entry.filename)) {
						submodels.push({stepID: step.id, ...entry});
						addedModelNames.add(entry.filename);
					}
				});
			}
		});
		return submodels;
	},
	topLevelTreeNodes() {  // Return list of pages & submodels to be drawn in the nav tree
		const nodes = store.get.pageList();
		store.get.submodels().forEach(submodel => {
			const page = store.get.pageForItem({id: submodel.stepID, type: 'step'});
			const pageIndex = nodes.indexOf(page);
			submodel.type = 'submodel';
			submodel.id = nodes.length;
			_.insert(nodes, submodel, pageIndex);
		});
		return nodes.filter(el => el);
	},
	nextItemID(item) {  // Get the next unused ID in this item's list
		if (item && item.type) {
			item = item.type;
		}
		const itemList = store.state[item + 's'];
		if (_.isEmpty(itemList)) {
			return 0;
		}
		return Math.max.apply(null, itemList.map(el => el.id)) + 1;
	},
	lookupToItem(lookup, type) {  // Convert a {type, id} lookup object into the actual item it refers to
		if (lookup == null || (!lookup.type && type == null)) {
			return null;
		}
		if (typeof lookup === 'number' && type != null) {
			lookup = {type, id: lookup};
		}
		if (lookup.parent || lookup.number != null || lookup.steps != null) {
			return lookup;  // lookup is already an item
		} else if (store.state.hasOwnProperty(lookup.type)) {
			return store.state[lookup.type];
		}
		const itemList = store.state[lookup.type + 's'];
		if (itemList) {
			return itemList.find(el => el.id === lookup.id) || null;
		}
		return null;
	},
	itemToLookup(item) {  // Create a {type, id} lookup object from the specified item
		if (!item || item.type == null) {
			return null;
		} else if (item.type === 'part' || item.type === 'submodel') {
			return item;
		} else if (store.state.hasOwnProperty(item.type)) {
			return {type: item.type, id: item.id || 0};
		} else if (!store.state.hasOwnProperty(item.type + 's')) {
			return null;
		}
		return {type: item.type, id: item.id};
	},
	coords: {
		pageToItem({x, y}, item) {  // x & y are in page coordinates; transform to item coordinates
			item = store.get.lookupToItem(item);
			while (item) {
				x -= item.x || 0;
				y -= item.y || 0;
				item = store.get.parent(item);
			}
			return {x, y};
		},
		itemToPage(item) {  // Find item's position on the page
			let x = 0, y = 0;
			item = store.get.lookupToItem(item);
			while (item) {
				x += item.x || 0;
				y += item.y || 0;
				item = store.get.parent(item);
			}
			return {x, y};
		},
		pointToPage(x, y, relativeTo) {
			if (typeof x === 'object' && y == null) {
				y = x.y;
				relativeTo = x.relativeTo;
				x = x.x;
			}
			const offset = store.get.coords.itemToPage(relativeTo);
			return {
				x: x + offset.x,
				y: y + offset.y
			};
		}
	},
	targetBoxFromPoints(t) {
		const parent = store.get.parent(t);
		const points = t.points.map(pointID => {
			const pt = store.get.point(pointID);
			return store.get.coords.pointToPage(pt.x, pt.y, pt.relativeTo || parent);
		});
		return _.geom.expandBox(_.geom.bbox(points), 8, 8);
	},
	targetBox(t) {
		if (t.points) {
			return store.get.targetBoxFromPoints(t);
		}

		const box = {x: t.x, y: t.y, width: t.width, height: t.height};
		if (t.borderOffset) {
			box.x += t.borderOffset.x;
			box.y += t.borderOffset.y;
		}
		if (t.align === 'right') {
			box.x -= box.width;
		}
		if (t.valign === 'bottom') {
			box.y -= box.height;
		}
		while (t) {
			if (t.relativeTo) {
				t = store.get.lookupToItem(t.relativeTo);
			} else {
				t = store.get.parent(t);
			}
			if (t) {
				if (t.innerContentOffset) {
					box.x += t.innerContentOffset.x || 0;
					box.y += t.innerContentOffset.y || 0;
				}
				box.x += t.x || 0;
				box.y += t.y || 0;
			}
		}
		return box;
	}
};
