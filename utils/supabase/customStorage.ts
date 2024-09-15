import { SupportedStorage } from "@supabase/supabase-js";

export const customStorageAdapter: SupportedStorage = {
  getItem: (key) => {
    if (!("localStorage" in globalThis)) {
      throw Error("localStorage not available");
    }
    return globalThis.localStorage.getItem(key)
  },

  setItem: (key, value) => {
    if (!("localStorage" in globalThis)) {
      throw Error("localStorage not available");
    }
    return globalThis.localStorage.setItem(key, value)
  },

  removeItem: (key) => {
    if (!("localStorage" in globalThis)) {
      throw Error("localStorage not available");
    }
    return globalThis.localStorage.removeItem(key)
  }
}