/* The signed-in session as the UI needs it. Empty in demo mode (no login). */
export const session = { email: '', active: false, pending: (): number => 0, signOut: async (): Promise<void> => {} };
