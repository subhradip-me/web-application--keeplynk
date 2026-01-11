import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isCollapsed: false,
  currentPersona: 'genaral',
  activeItem: 'Home',
  expandedItems: {},
  showPersonaDropdown: false,
  user: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  userPersonas: [
    { personaType: 'genaral', customName: null },
    { personaType: 'professional', customName: null },
  ]
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isCollapsed = !state.isCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
    },
    setCurrentPersona: (state, action) => {
      state.currentPersona = action.payload;
      state.activeItem = 'Home';
      state.showPersonaDropdown = false;
    },
    setActiveItem: (state, action) => {
      state.activeItem = action.payload;
    },
    toggleExpandedItem: (state, action) => {
      const itemTitle = action.payload;
      state.expandedItems[itemTitle] = !state.expandedItems[itemTitle];
    },
    togglePersonaDropdown: (state) => {
      state.showPersonaDropdown = !state.showPersonaDropdown;
    },
    closePersonaDropdown: (state) => {
      state.showPersonaDropdown = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserPersonas: (state, action) => {
      state.userPersonas = action.payload;
    },
    addPersona: (state, action) => {
      state.userPersonas.push(action.payload);
    }
  }
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setCurrentPersona,
  setActiveItem,
  toggleExpandedItem,
  togglePersonaDropdown,
  closePersonaDropdown,
  setUser,
  setUserPersonas,
  addPersona
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
