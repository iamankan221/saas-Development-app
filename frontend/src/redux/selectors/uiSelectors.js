// UI Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectTheme = (state) => state.ui.theme;
export const selectNotifications = (state) => state.ui.notifications;
export const selectModals = (state) => state.ui.modals;
export const selectIsLoading = (state) => state.ui.loading;

export const selectModalOpen = (state, modalName) => {
  return state.ui.modals[modalName] || false;
};
