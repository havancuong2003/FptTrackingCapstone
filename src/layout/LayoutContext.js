import React from 'react';

export const LayoutContext = React.createContext({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export function useLayout() {
  return React.useContext(LayoutContext);
} 