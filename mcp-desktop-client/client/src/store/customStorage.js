const customStorage = {
	getItem: async (name) => {
		try {
			return window.electron.store.get(name);
		} catch (error) {
			console.error(`Error getting item "${name}":`, error);
			return null;
		}
	},

	setItem: async (name, value) => {
		try {
			window.electron.store.set(name, value);
		} catch (error) {
			console.error(`Error setting item "${name}":`, error);
		}
	},

	removeItem: async (name) => {
		try {
			window.electron.store.delete(name);
		} catch (error) {
			console.error(`Error removing item "${name}":`, error);
		}
	},
};

export default customStorage;
