/* Web Lic - Copyright (C) 2018 Remi Gagne */

<template>
	<div id="tree">
		<div class="treeButtons">
			<el-button icon="fas fa-expand-arrows-alt" @click="expand" />
			<el-button icon="fas fa-compress" @click="collapse" />
			<el-dropdown
				id="treeShowHideMenu"
				:hide-on-click="false"
				size="mini"
				trigger="click"
				placement="bottom-start"
				@command="checkItem"
			>
				<span class="el-dropdown-link">{{tr('nav_tree.show')}}</span>
				<el-dropdown-menu slot="dropdown" class="treeShowHideDropdown">
					<template v-for="(el, idx) in checkedElements">
						<el-dropdown-item
							v-if="el.name === 'divider'"
							:key="`${el}_${idx}`"
							:divided="true"
						/>
						<el-dropdown-item
							v-else
							:key="`${el}_${idx}`"
							:command="el"
						>
							{{tr(el.name)}}
							<i v-if="el.checked" class="fas fa-check"/>
						</el-dropdown-item>
					</template>
				</el-dropdown-menu>
			</el-dropdown>
		</div>
		<ul class="treeScroll">
			<li
				v-for="(node, idx) in store.get.topLevelTreeNodes()"
				:key="`root_${idx}`"
			>
				<TreeExpandableRow
					v-if="node.type.toLowerCase().endsWith('page')"
					:row-visibility="rowVisibility"
					:current-item="currentItem"
					:target="node"
					@select-item="$emit('select-item', arguments[0])"
				/>
				<TreeRow
					v-else
					:current-item="currentItem"
					:target="node"
					@select-item="$emit('select-item', arguments[0])"
				/>
			</li>
		</ul>
	</div>
</template>

<script>
/* global Vue: false */

import uiState from '../../uiState';
import store from '../../store';
import TreeExpandableRow from './expandable_row.vue';
import TreeRow from './row.vue';

let navTreeState = uiState.get('navTree');
if (navTreeState == null) {  // temp backwards compatibility fixup
	navTreeState = {
		expandedLevel: 0,
		checkedItems: {
			all: true, page_step_part: false, group_parts: false,
			steps: true, submodelImages: true, submodelCSI: true, csis: true, parts: true,
			plis: true, pliItems: true, callouts: true, calloutArrows: true,
			annotations: true, numberLabels: true, quantityLabels: true, dividers: true
		}
	};
	uiState.set('navTree', navTreeState);
}

const treeElementList = [
	{name: 'nav_tree.all', value: 'all', checked: false},
	{name: 'nav_tree.page_step_part', value: 'page_step_part', checked: false},
	{name: 'divider'},
	{name: 'nav_tree.steps', value: 'steps', checked: false, child: true},
	{name: 'nav_tree.submodel_images', value: 'submodelImages', checked: false, child: true},
	{name: 'nav_tree.submodel_csi', value: 'submodelCSI', checked: false, child: true},
	{name: 'nav_tree.csis', value: 'csis', checked: false, child: true},
	{name: 'nav_tree.parts', value: 'parts', checked: false, child: true},
	{name: 'nav_tree.plis', value: 'plis', checked: false, child: true},
	{name: 'nav_tree.pli_items', value: 'pliItems', checked: false, child: true},
	{name: 'nav_tree.callouts', value: 'callouts', checked: false, child: true},
	{name: 'nav_tree.callout_arrows', value: 'calloutArrows', checked: false, child: true},
	{name: 'nav_tree.annotations', value: 'annotations', checked: false, child: true},
	{name: 'nav_tree.number_labels', value: 'numberLabels', checked: false, child: true},
	{name: 'nav_tree.quantity_labels', value: 'quantityLabels', checked: false, child: true},
	{name: 'nav_tree.dividers', value: 'dividers', checked: false, child: true},
	{name: 'divider'},
	{name: 'nav_tree.group_parts', value: 'group_parts', checked: false}
];

treeElementList.forEach(el => (el.checked = navTreeState.checkedItems[el.value]));

// TODO: need to scroll nav tree up / down whenever selected item changes, to ensure it's always in view
export default {
	name: 'NavTree',
	components: {TreeExpandableRow, TreeRow},
	props: ['currentItem'],
	data() {
		this.store = store;
		return {
			checkedElements: treeElementList,
			expandedLevel: navTreeState.expandedLevel,
			expandLeveInitialized: false
		};
	},
	methods: {
		forceUpdate() {
			this.$forceUpdate();
			this.$children.forEach(c => {
				if (typeof c.forceUpdate === 'function') {
					c.forceUpdate();
				}
			});
		},
		checkItem(item) {
			if (!item) {
				return;
			}
			item.checked = !item.checked;
			if (item.value === 'all') {
				this[item.checked ? 'checkAll' : 'checkPageStepParts']();
			} else if (item.value === 'page_step_part') {
				this[item.checked ? 'checkPageStepParts' : 'checkAll']();
			// } else if (item.name === 'Group Parts By Type') {
			}
			Vue.nextTick(() => {
				this.forceUpdate();
			});
		},
		checkAll() {
			this.checkedElements.forEach(el => {
				if (el.hasOwnProperty('child') || el.value === 'all') {
					el.checked = true;
				} else if (el.value === 'page_step_part') {
					el.checked = false;
				}
			});
		},
		checkPageStepParts() {
			this.checkedElements.forEach(el => {
				if (el.value === 'steps' || el.value === 'csis'
					|| el.value === 'parts' || el.value === 'page_step_part'
				) {
					el.checked = true;
				} else if (el.hasOwnProperty('child') || el.value === 'all') {
					el.checked = false;
				}
			});
		},
		expand() {
			const level = this.expandedLevel;
			this.$children.forEach(c => {
				if (c.hasOwnProperty('expanded')) {
					if (level === 0) {
						c.expanded = true;
					} else {
						c.expandChildren(1, level);
					}
				}
			});
			this.expandedLevel += 1;
		},
		collapse() {
			const level = this.expandedLevel;
			if (level < 1) {
				return;
			}
			this.$children.forEach(c => {
				if (c.hasOwnProperty('expanded')) {
					if (level === 1) {
						c.expanded = false;
					}
					c.collapseChildren(1, level - 1);
				}
			});
			this.expandedLevel -= 1;
		},
		saveState() {
			navTreeState.expandedLevel = this.expandedLevel;
			this.checkedElements.forEach(el => (navTreeState.checkedItems[el.value] = el.checked));
		}
	},
	computed: {
		rowVisibility() {
			const res = {};
			treeElementList.filter(el => el.child).forEach(el => (res[el.value] = el.checked));
			return res;
		}
	},
	updated() {
		if (!this.expandLeveInitialized) {
			const expandedLevel = this.expandedLevel;
			this.expandedLevel = 0;
			for (let i = 0; i < expandedLevel; i++) {
				this.expand();
			}
			this.expandLeveInitialized = true;
		}
	}
};

</script>

<style>

#tree {
	height: 100%;
	display: flex;
	flex-direction: column;
}

.treeButtons {
	display: flex;
	padding: 10px;
	min-width: 110px;
	border-bottom: 1px solid #AAA;
}

.treeButtons > button {
	align-self: flex-end;
	margin-left: auto;
	font-size: 8pt;
	margin-right: 6px;
	padding: 6px 7px;
}

.treeButtons .el-dropdown {
	float: right;
	height: 24px;
	font-size: 10pt;
	padding: 2px 5px;
}

.treeShowHideDropdown {
	min-width: 190px;
}

.treeShowHideDropdown i {
	padding-top: 5px;
}

.treeScroll {
	flex: 1;
	overflow-y: auto;
	padding: 10px 0 50px 10px;
	margin: 0;
}

.indent {
	margin-left: 35px;
	list-style-type: none;
}

.unindent {
	position: relative;
	left: -16px;
	white-space: nowrap;
}

.treeIcon {
	display: inline-block;
	width: 10px;
	font-size: 1.25em;
	vertical-align: 1px;
}

.treeText {
	font: 9pt Helvetica;
	white-space:nowrap;
	overflow: hidden;
	position: relative;
	bottom: 4px;
	width: 100%;
	border: 1px dashed #fff;
}

</style>
