import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ObjectList from './components/ObjectList';
import DataGrid from './components/DataGrid';
import RecordDetail from './components/RecordDetail';
import SchemaInspector from './components/SchemaInspector';

function App() {
  return (
    <BrowserRouter basename="/console">
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1 className="logo">
              <Link to="/">ObjectQL Console</Link>
            </h1>
            <nav className="nav">
              <Link to="/" className="nav-link">Objects</Link>
              <Link to="/schema" className="nav-link">Schema</Link>
            </nav>
          </div>
        </header>
        
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<ObjectList />} />
              <Route path="/object/:objectName" element={<DataGrid />} />
              <Route path="/object/:objectName/:recordId" element={<RecordDetail />} />
              <Route path="/schema" element={<SchemaInspector />} />
              <Route path="/schema/:objectName" element={<SchemaInspector />} />
            </Routes>
          </div>
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>ObjectQL Console v0.1.0 - Universal Database Management</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
