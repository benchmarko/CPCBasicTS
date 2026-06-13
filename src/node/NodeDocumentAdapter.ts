interface NodeDomElement {
	className: string;
	style: {
		borderwidth: string;
		borderStyle: string;
	};
	options: any[];
	value?: string;
	text?: string;
	title?: string;
	selected?: boolean;
	childNodes?: any[];
	childElementCount?: number;
	firstChild?: any;
	lastChild?: any;
	addEventListener: () => void;
	removeEventListener: () => void;
	getAttribute: () => string;
	setAttribute: (name: string, value: string) => void;
	add?: (option: any) => void;
	appendChild?: (child: any) => any;
	removeChild?: (child: any) => any;
	click?: () => void;
	focus?: () => void;
	setSelectionRange?: (_selectionStart: number, _selectionEnd: number) => void;
	setCustomValidity?: (_error: string) => void;
	checkValidity?: () => boolean;
	[node: string]: any;
}

function createNodeDomElement(): NodeDomElement {
	const element: NodeDomElement = {
		className: "",
		style: {
			borderwidth: "",
			borderStyle: ""
		},
		options: [],
		value: "",
		text: "",
		title: "",
		selected: false,
		childNodes: [],
		childElementCount: 0,
		firstChild: undefined,
		lastChild: undefined,
		addEventListener: () => {
			// nothing
		},
		removeEventListener: () => {
			// nothing
		},
		getAttribute: () => "",
		setAttribute: (name: string, value: string) => {
			element[name] = value;
		},
		appendChild: (child: any) => {
			element.childNodes?.push(child);
			element.childElementCount = element.childNodes?.length || 0;
			element.firstChild = element.childNodes?.[0];
			element.lastChild = element.childNodes?.[element.childNodes.length - 1];
			return child;
		},
		removeChild: (child: any) => {
			const idx = element.childNodes?.indexOf(child) ?? -1;

			if (idx >= 0) {
				element.childNodes?.splice(idx, 1);
			}
			element.childElementCount = element.childNodes?.length || 0;
			element.firstChild = element.childNodes?.[0];
			element.lastChild = element.childNodes?.[element.childNodes.length - 1];
			return child;
		},
		click: () => {
			// nothing
		},
		focus: () => {
			// nothing
		},
		setSelectionRange: () => {
			// nothing
		},
		setCustomValidity: () => {
			// nothing
		},
		checkValidity: () => true
	};

	element.add = (option: any) => {
		element.options.push(option);
		if (element.options.length === 1 || option.selected) {
			element.value = element.options[element.options.length - 1].value;
		}
	};

	Object.defineProperty(element, "length", {
		get() {
			return element.options.length;
		},
		set(len: number) {
			element.options.length = len;
		},
		enumerable: true,
		configurable: true
	});

	return element;
}

export class NodeDocumentAdapter {
	private readonly domElements: Record<string, NodeDomElement> = {};
	fullscreenElement: undefined;
	activeElement: undefined;

	addEventListener() {
		// nothing
	}

	removeEventListener() {
		// nothing
	}

	getElementById(id: string) {
		if (!this.domElements[id]) {
			this.domElements[id] = createNodeDomElement();
		}
		return this.domElements[id];
	}

	createElement(type: string) {
		if (type === "option") {
			return {
				value: "",
				text: "",
				title: "",
				selected: false
			};
		}
		return createNodeDomElement();
	}
}