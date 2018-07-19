'use strict';

import _ from '../util';
import store from '../store';
import Layout from '../layout';

export default {
	add(opts) {  // opts: {annotationType, properties, parent, x, y}

		const annotation = store.mutations.item.add({item: {
			type: 'annotation',
			annotationType: opts.annotationType
		}, parent: opts.parent});

		_.copy(annotation, opts.properties);

		// Guarantee some nice defaults
		if (annotation.annotationType === 'label') {
			annotation.text = annotation.text || 'Label';
			annotation.font = annotation.font || '20pt Helvetica';
			annotation.color = annotation.color || 'black';
			annotation.align = 'left';
			annotation.valign = 'top';
			annotation.x = opts.x;
			annotation.y = opts.y;
			if (opts.properties.text) {
				Layout.label(annotation);
			}
		} else if (annotation.annotationType === 'arrow') {
			annotation.points = [];
			store.mutations.item.add({item: {
				type: 'point', x: opts.x, y: opts.y
			}, parent: annotation});

			store.mutations.item.add({item: {
				type: 'point', x: opts.x + 100, y: opts.y
			}, parent: annotation});
		} else {
			// image annotation width & height set by image load logic during first draw
			annotation.x = opts.x;
			annotation.y = opts.y;
		}
		return annotation;
	},
	set(opts) {  // opts: {annotation, newProperties, doLayout}
		const annotation = store.get.lookupToItem(opts.annotation);
		const props = opts.newProperties || {};
		if (props.text && annotation.annotationType === 'label') {
			annotation.text = props.text;
			Layout.label(annotation);
		}
		if (opts.doLayout) {
			store.mutations.page.layout({page: store.get.pageForItem(annotation)});
		}
	},
	delete(opts) {  // opts: {annotation}
		const item = store.get.lookupToItem(opts.annotation);
		if (item.hasOwnProperty('points')) {
			store.mutations.item.deleteChildList({item, listType: 'point'});
		}
		store.mutations.item.delete({item});
	}
};