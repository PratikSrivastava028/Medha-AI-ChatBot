import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useDispatch } from 'react-redux'
import App from './App.jsx'
import './App.css'
import './styles/themes.css'
import './styles/forms.css'
import store from './store/store'
import { initAuth } from './store/authSlice'

function Root() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);
  
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Root />
    </Provider>
  </StrictMode>,
)
