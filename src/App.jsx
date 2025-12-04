import './App.css';
import AppRouter from './router/appRouter'
import { Header } from './Components';

function App() {
  return (
    <div className="App">
      <Header />
      <AppRouter />
    </div>
  );
}

export default App;