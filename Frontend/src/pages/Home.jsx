import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../store/authSlice';
import { setChats, createChat as createChatAction, openChat as openChatAction, addMessage as addMessageAction, deleteChat as deleteChatAction, togglePin as togglePinAction, toggleArchive as toggleArchiveAction, renameChat as renameChatAction, setMessagesForChat } from '../store/chatsSlice';
import Sidebar from '../components/Sidebar';
import ChatMain from '../components/ChatMain';
import socketService from '../services/socketService';

export default function Home() {
  const previousChats = useSelector(s => s.chats.chats);
  const activeChatId = useSelector(s => s.chats.currentChatId);
  const messages = useSelector(s => (s.chats.messagesByChat && s.chats.messagesByChat[activeChatId]) ? s.chats.messagesByChat[activeChatId] : []);
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();
  
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize socket connection on mount
  useEffect(() => {
    console.log('🔌 Initializing socket connection...');
    socketService.connect();

    // Listen for connection status changes
    const handleConnectionStatus = (status) => {
      console.log('📡 Connection status:', status);
      setConnectionStatus(status);
    };

    socketService.on('connection-status', handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket...');
      socketService.off('connection-status', handleConnectionStatus);
      socketService.disconnect();
    };
  }, []);

  // Load chats from backend on mount
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/chat`, { withCredentials: true });
        if (res.data.chats) {
          // Normalize _id to id for frontend compatibility
          const serverChats = res.data.chats.map(c => ({
            ...c,
            id: c._id
          }));
          
          // Merge with any offline chats saved in localStorage
          let mergedChats = [...serverChats];
          try {
            const raw = localStorage.getItem('previousChats');
            if (raw) {
              const localChats = JSON.parse(raw);
              // Add local chats that don't exist in server chats (typically those with timestamp IDs)
              localChats.forEach(lc => {
                if (!mergedChats.find(sc => sc.id === lc.id)) {
                  mergedChats.push(lc);
                }
              });
              // Sort by lastActivity descending
              mergedChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
            }
          } catch (e) {
            console.error('Error merging local chats:', e);
          }
          
          dispatch(setChats(mergedChats));
          
          // Optionally load messages for the first chat if one exists
          if (mergedChats.length > 0) {
            const firstChatId = mergedChats[0].id;
            
            // Try to load local messages first
            let localMsgsLoaded = false;
            try {
              const rawMsgs = localStorage.getItem('messagesByChat');
              if (rawMsgs) {
                const parsedMsgs = JSON.parse(rawMsgs);
                if (parsedMsgs[firstChatId] && parsedMsgs[firstChatId].length > 0) {
                   dispatch(setMessagesForChat({ chatId: firstChatId, messages: parsedMsgs[firstChatId] }));
                   localMsgsLoaded = true;
                }
              }
            } catch(e) {}
            
            // Only fetch from server if it's a valid ObjectId (not a local timestamp ID)
            if (firstChatId.length === 24) {
              const msgRes = await axios.get(`${API_BASE_URL}/api/chat/${firstChatId}/messages`, { withCredentials: true });
              if (msgRes.data.messages && msgRes.data.messages.length > 0) {
                const normalizedMsgs = msgRes.data.messages.map(m => ({
                  id: m._id,
                  from: m.role === 'user' ? 'user' : 'ai',
                  text: m.content,
                  time: m.createdAt
                }));
                // Merge or replace
                dispatch(setMessagesForChat({ chatId: firstChatId, messages: normalizedMsgs }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch chats from server:', err);
        // Fallback to localStorage if server fails
        const raw = localStorage.getItem('previousChats');
        if (raw) dispatch(setChats(JSON.parse(raw)));
      }
    }
    
    if (user) {
      fetchChats();
    }
    
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dispatch, user]);

  // Persist previous chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('previousChats', JSON.stringify(previousChats));
    } catch (e) {
      console.error('Failed to save chats:', e);
    }
  }, [previousChats]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menus when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      const target = e.target;
      if (target.closest && (target.closest('.chat-menu') || target.closest('.control-trigger'))) {
        return;
      }
      setMenuOpenId(null);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      const target = e.target;
      if (target.closest && (target.closest('.sidebar-footer') || target.closest('.user-menu') || target.closest('.sidebar-user-trigger'))) {
        return;
      }
      setUserMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  async function createNewChat() {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat`, { title: 'New Chat' }, { withCredentials: true });
      if (res.data.chat) {
        const chat = { 
          ...res.data.chat, 
          id: res.data.chat._id,
          pinned: false, 
          archived: false 
        };
        dispatch(createChatAction(chat));
        dispatch(openChatAction(chat.id));
        setRenameId(chat.id);
        setRenameValue('');
        setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to create chat on server:', err);
      // Fallback to local only if server fails
      const id = Date.now().toString();
      const chat = { id, title: 'New Chat', lastActivity: new Date().toISOString(), pinned: false, archived: false };
      dispatch(createChatAction(chat));
      dispatch(openChatAction(id));
      setRenameId(id);
      setRenameValue('');
      setShowSidebar(false);
    }
  }

  async function openChat(chat) {
    dispatch(openChatAction(chat.id));
    setShowSidebar(false);
    
    // Fetch messages if not already loaded or if selecting a different chat
    if (!messages.length || activeChatId !== chat.id) {
      // First try to load local messages
      let localMsgsLoaded = false;
      try {
        const rawMsgs = localStorage.getItem('messagesByChat');
        if (rawMsgs) {
          const parsedMsgs = JSON.parse(rawMsgs);
          if (parsedMsgs[chat.id] && parsedMsgs[chat.id].length > 0) {
             dispatch(setMessagesForChat({ chatId: chat.id, messages: parsedMsgs[chat.id] }));
             localMsgsLoaded = true;
          }
        }
      } catch(e) {}

      // Only fetch from server if it's a valid ObjectId (24 chars hex)
      if (chat.id.length === 24) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/chat/${chat.id}/messages`, { withCredentials: true });
          if (res.data.messages && res.data.messages.length > 0) {
            const normalizedMsgs = res.data.messages.map(m => ({
              id: m._id,
              from: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
              time: m.createdAt
            }));
            dispatch(setMessagesForChat({ chatId: chat.id, messages: normalizedMsgs }));
          }
        } catch (err) {
          console.error('Failed to fetch messages for chat:', err);
        }
      }
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    
    // Check connection status
    if (!connectionStatus.connected) {
      alert('Not connected to server. Please check your connection.');
      return;
    }

    const userMsg = { id: Date.now().toString(), from: 'user', text, time: new Date().toISOString() };
    
    // Create chat if none exists
    let chatId = activeChatId;
    if (!chatId) {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/chat`, { 
          title: text.substring(0, 30) + (text.length > 30 ? '...' : '') 
        }, { withCredentials: true });
        
        if (res.data.chat) {
          const chat = { 
            ...res.data.chat, 
            id: res.data.chat._id,
            pinned: false, 
            archived: false 
          };
          chatId = chat.id;
          dispatch(createChatAction(chat));
          dispatch(openChatAction(chatId));
        }
      } catch (err) {
        console.error('Failed to create chat on server during message send:', err);
        // Fallback to local
        chatId = Date.now().toString();
        const chat = { id: chatId, title: text.substring(0, 30) + (text.length > 30 ? '...' : ''), lastActivity: new Date().toISOString(), pinned: false, archived: false };
        dispatch(createChatAction(chat));
        dispatch(openChatAction(chatId));
      }
    }

    // Add user message to store
    dispatch(addMessageAction({ chatId, message: userMsg }));
    setInput('');
    inputRef.current?.focus();

    // Show typing indicator
    setIsGenerating(true);

    try {
      // Send message via Socket.io
      console.log('📤 Sending message via socket:', text);
      const response = await socketService.sendMessage(chatId, text);
      
      console.log('📨 Received AI response:', response);
      
      // Add AI response to store
      const aiMsg = {
        id: Date.now().toString() + "-ai",
        from: 'ai',
        text: response.content || 'No response from AI',
        time: new Date().toISOString()
      };
      
      dispatch(addMessageAction({ chatId, message: aiMsg }));
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Add error message
      const errorMsg = {
        id: Date.now().toString() + "-error",
        from: 'ai',
        text: `Error: ${error.message || 'Failed to get response from AI. Please try again.'}`,
        time: new Date().toISOString()
      };
      
      dispatch(addMessageAction({ chatId, message: errorMsg }));
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  }

  function deleteChat(id) {
    dispatch(deleteChatAction(id));
    setMenuOpenId(null);
  }

  function togglePin(id) {
    dispatch(togglePinAction(id));
  }

  function toggleArchive(id) {
    dispatch(toggleArchiveAction(id));
  }

  function confirmRename(id) {
    const v = renameValue.trim();
    if (!v) return;
    dispatch(renameChatAction({ id, title: v }));
    setRenameId(null);
    setRenameValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleLogout() {
    dispatch(clearUser());
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('previousChats');
    localStorage.removeItem('messagesByChat');
    window.location.href = '/login';
  }

  // Derived ordered chats: pinned first, then others by lastActivity (newest first)
  function getOrderedChats() {
    const copy = [...previousChats];
    copy.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      const ta = new Date(a.lastActivity).getTime() || 0;
      const tb = new Date(b.lastActivity).getTime() || 0;
      return tb - ta;
    });
    return copy;
  }

  return (
    <div className="chat-page">
      {/* global hamburger: shown when sidebar is hidden on mobile or when collapsed on desktop */}
      <button
        className="global-hamburger"
        onClick={() => {
          if (isMobile) {
            setShowSidebar(s => !s);
          } else {
            setSidebarCollapsed(s => !s);
          }
        }}
        aria-label="Toggle chats"
        style={{ display: (isMobile ? (!showSidebar ? 'flex' : 'none') : (sidebarCollapsed ? 'flex' : 'none')) }}
      >☰</button>

      <div className={`chat-container ${showSidebar ? 'show-sidebar' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {showSidebar && isMobile && (
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} aria-hidden="true"></div>
        )}
         <Sidebar
          previousChats={previousChats}
          getOrderedChats={getOrderedChats}
          activeChatId={activeChatId}
          openChat={openChat}
          createNewChat={createNewChat}
          setSidebarCollapsed={setSidebarCollapsed}
          menuOpenId={menuOpenId}
          setMenuOpenId={setMenuOpenId}
          deleteChat={deleteChat}
          togglePin={togglePin}
          toggleArchive={toggleArchive}
          setRenameId={setRenameId}
          setRenameValue={setRenameValue}
          renameId={renameId}
          renameValue={renameValue}
          confirmRename={confirmRename}
          user={user}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          sidebarCollapsed={sidebarCollapsed}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          onProfileClick={() => setProfileModalOpen(true)}
        />

        <ChatMain
          messages={messages}
          messagesEndRef={messagesEndRef}
          input={input}
          setInput={setInput}
          handleKeyDown={handleKeyDown}
          sendMessage={sendMessage}
          isGenerating={isGenerating}
          inputRef={inputRef}
          connectionStatus={connectionStatus}
        />
      </div>

      {profileModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setProfileModalOpen(false)} aria-label="Close profile">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="profile-modal-header">
              <div className="profile-large-avatar">
                {(user?.firstName && user?.lastName) ? (user.firstName[0] + user.lastName[0]).toUpperCase() : 'U'}
              </div>
              <h3 className="profile-name">
                {(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'Medha User'}
              </h3>
              <p className="profile-email">{user?.email || 'No email associated'}</p>
            </div>
            <div className="profile-details-grid">
              <div className="profile-detail-card">
                <span className="profile-detail-label">Active Conversations</span>
                <span className="profile-detail-value">{previousChats.length}</span>
              </div>
              <div className="profile-detail-card">
                <span className="profile-detail-label">Pinned Chats</span>
                <span className="profile-detail-value">{previousChats.filter(c => c.pinned).length}</span>
              </div>
            </div>
            <div className="profile-modal-actions">
              <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setProfileModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
