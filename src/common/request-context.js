import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export const requestContext = {
  run(store, callback) {
    return asyncLocalStorage.run(store, callback);
  },
  get(key) {
    const store = asyncLocalStorage.getStore();
    return store ? store.get(key) : undefined;
  },
  set(key, value) {
    const store = asyncLocalStorage.getStore();
    if (store) store.set(key, value);
  },
};
