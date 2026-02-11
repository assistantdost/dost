// customStorage.js
const customStorage = {
	getItem: (name) => {
		const item = localStorage.getItem(name);
		return item ? JSON.parse(item) : null;
	},
	setItem: (name, value) => {
		localStorage.setItem(name, JSON.stringify(value));
	},
	removeItem: (name) => {
		localStorage.removeItem(name);
	},
};

export default customStorage;
