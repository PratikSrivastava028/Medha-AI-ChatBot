import { configureStore } from '@reduxjs/toolkit';
import chatsReducer from './chatsSlice';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    chats: chatsReducer,
    auth: authReducer
  }
});

// persist chats to localStorage on changes
store.subscribe(()=>{
  try{
    const state = store.getState();
    const toSave = state.chats.chats || [];
    localStorage.setItem('previousChats', JSON.stringify(toSave));
    // also persist messagesByChat for simplicity
    localStorage.setItem('messagesByChat', JSON.stringify(state.chats.messagesByChat || {}));
    localStorage.setItem('currentChatId', state.chats.currentChatId || '');
  }catch(e){/* ignore */}
});

export default store;
