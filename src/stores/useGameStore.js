import { create } from 'zustand'

export const useGameStore = create((set) => ({
    mouseLookEnabled: false,
    toggleMouseLook: () => set((state) => ({ mouseLookEnabled: !state.mouseLookEnabled })),
    setMouseLook: (enabled) => set({ mouseLookEnabled: enabled }),
}))
