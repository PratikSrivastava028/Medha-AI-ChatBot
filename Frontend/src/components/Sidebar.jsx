import React from 'react';

export default function Sidebar(props){
  const {
    previousChats, getOrderedChats, activeChatId, openChat,
    createNewChat, menuOpenId, setMenuOpenId, deleteChat,
    togglePin, toggleArchive, setRenameId, setRenameValue, renameId, renameValue, confirmRename,
    user, userMenuOpen, setUserMenuOpen, showSidebar, setShowSidebar, sidebarCollapsed, onLogout,
    theme, toggleTheme, onProfileClick
  } = props;
  // optional setter for collapsing sidebar on desktop (passed from Home)
  const { setSidebarCollapsed } = props;

  const chats = getOrderedChats();

  return (
    <aside className="chat-sidebar" aria-hidden={sidebarCollapsed || (!showSidebar && window.innerWidth < 768)}>
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <div className="sidebar-header-row">
            <button
              className="sidebar-hamburger"
              aria-label="Toggle chats"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setShowSidebar(s => !s);
                } else if (typeof setSidebarCollapsed === 'function') {
                  setSidebarCollapsed(s => !s);
                }
              }}
            >☰</button>
            <div className="header-separator" aria-hidden></div>
            <h2 className="sidebar-title">Medha</h2>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sun-icon">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="moon-icon">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
          <button className="sidebar-new-chat-btn" onClick={createNewChat} aria-label="New chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
          <div className="sidebar-subtitle">Previous Chats</div>
        </div>

        <ul className="chats-list">
          {previousChats.length===0 && <li className="empty">No previous chats</li>}
          {chats.map(chat=> (
            <li key={chat.id} className={`chat-item ${chat.id===activeChatId? 'active':''} ${chat.archived? 'archived':''}`}>
              <div className="chat-item-main" onClick={()=>openChat(chat)}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {chat.pinned && <span className="pin-icon" aria-hidden>📌</span>}
                  <div className="chat-item-title">{chat.title}</div>
                </div>
                <div className="chat-item-time">{new Date(chat.lastActivity).toLocaleString()}</div>
              </div>

              <div className="chat-item-controls">
                <button className="control-trigger" onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===chat.id? null: chat.id); setRenameId(null); }} aria-label="Chat options">⋯</button>
                {menuOpenId===chat.id && (
                  <div className="chat-menu" onClick={(e)=>e.stopPropagation()}>
                    <button onClick={()=>{ deleteChat(chat.id); setMenuOpenId(null); }}>Delete</button>
                    <button onClick={()=>{ togglePin(chat.id); setMenuOpenId(null); }}>{chat.pinned? 'Unpin':'Pin'}</button>
                    <button onClick={()=>{ toggleArchive(chat.id); setMenuOpenId(null); }}>{chat.archived? 'Unarchive':'Archive'}</button>
                    <button onClick={()=>{ setRenameId(chat.id); setRenameValue(chat.title); setMenuOpenId(null); }}>Rename</button>
                  </div>
                )}
              </div>

              {renameId===chat.id && (
                <div className="rename-overlay" onClick={(e)=>e.stopPropagation()}>
                  <input className="rename-input" value={renameValue} onChange={e=>setRenameValue(e.target.value)} />
                  <div className="rename-actions">
                    <button onClick={()=>confirmRename(chat.id)}>Save</button>
                    <button onClick={()=>{ setRenameId(null); setRenameValue(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div
            className="sidebar-user-trigger"
            onClick={(e)=>{
              e.stopPropagation();
              if(window.innerWidth < 768) setShowSidebar(true);
              setUserMenuOpen(s=>!s);
            }}
          >
            <div className="sidebar-user-avatar">{(user?.firstName && user?.lastName) ? (user.firstName[0] + user.lastName[0]).toUpperCase() : 'U'}</div>
            <div className="sidebar-user-name">{(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'User'}</div>
            <div className="sidebar-user-caret">▾</div>
          </div>

          {userMenuOpen && (
            <div className="user-menu" onClick={(e)=>e.stopPropagation()}>
              <div className="user-menu-item user-menu-info">
                <div className="user-menu-avatar">{(user?.firstName && user?.lastName) ? (user.firstName[0] + user.lastName[0]).toUpperCase() : 'U'}</div>
                <div>
                  <div className="user-menu-name">{(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                  <div className="user-menu-email">{(user && user.email) ? user.email : '—'}</div>
                </div>
              </div>
              <div className="user-menu-actions">
                <button onClick={()=>{ setUserMenuOpen(false); if(onProfileClick) onProfileClick(); }}>Profile</button>
                <button onClick={()=>{ setUserMenuOpen(false); if(onLogout) onLogout(); }}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
