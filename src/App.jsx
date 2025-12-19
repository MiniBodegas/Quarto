import './App.css';
import { useLocation } from 'react-router-dom';
import AppRouter from './router/appRouter'
import { Header } from './Components';

function App() {
  const location = useLocation();
  
  // Rutas donde NO se debe mostrar el Header global
  const routesWithoutHeader = ['/user', '/admin', '/login'];
  const shouldShowHeader = !routesWithoutHeader.includes(location.pathname);
  
  // Rutas que ocupan toda la pantalla (sin márgenes ni padding)
  const fullScreenRoutes = ['/user', '/admin', '/login'];
  const isFullScreen = fullScreenRoutes.includes(location.pathname);

  return (
    <div className={`App ${isFullScreen ? 'fullscreen' : 'container'}`}>
      {shouldShowHeader && <Header />}
      <AppRouter />
    </div>
  );
}

export default App;