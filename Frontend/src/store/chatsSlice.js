import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  currentChatId: null,
  messagesByChat: {},
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setChats(state, action){
      state.chats = action.payload || [];
      if(state.chats.length && !state.currentChatId) state.currentChatId = state.chats[0].id;
    },
    createChat(state, action){
      const chat = action.payload;
      state.chats.unshift(chat);
      state.currentChatId = chat.id;
      state.messagesByChat[chat.id] = [];
    },
    openChat(state, action){
      const id = action.payload;
      state.currentChatId = id;
      if(!state.messagesByChat[id]) state.messagesByChat[id] = [];
    },
    deleteChat(state, action){
      const id = action.payload;
      state.chats = state.chats.filter(c=>c.id !== id);
      delete state.messagesByChat[id];
      if(state.currentChatId === id) state.currentChatId = state.chats.length? state.chats[0].id : null;
    },
    renameChat(state, action){
      const { id, title } = action.payload;
      state.chats = state.chats.map(c=> c.id===id? {...c, title }: c);
    },
    togglePin(state, action){
      const id = action.payload;
      state.chats = state.chats.map(c=> c.id===id? {...c, pinned: !c.pinned }: c);
    },
    toggleArchive(state, action){
      const id = action.payload;
      state.chats = state.chats.map(c=> c.id===id? {...c, archived: !c.archived }: c);
    },
    addMessage(state, action){
      const { chatId, message } = action.payload;
      if(!chatId) return;
      if(!state.messagesByChat[chatId]) state.messagesByChat[chatId] = [];
      state.messagesByChat[chatId].push(message);
      // update lastActivity on chat
      state.chats = state.chats.map(c=> c.id===chatId? {...c, lastActivity: message.time }: c);
    },
    setMessagesForChat(state, action){
      const { chatId, messages } = action.payload;
      state.messagesByChat[chatId] = messages || [];
    },
    clearMessages(state, action){
      const chatId = action.payload;
      if(chatId) state.messagesByChat[chatId] = [];
    }
  }
});

export const { setChats, createChat, openChat, deleteChat, renameChat, togglePin, toggleArchive, addMessage, setMessagesForChat, clearMessages } = chatsSlice.actions;
export default chatsSlice.reducer;
