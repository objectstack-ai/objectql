import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { ObjectView } from '@/pages/ObjectView';
import './index.css';

// Wrapper to extract params
function ObjectViewWrapper() {
  const { name } = useParams();
  if (!name) return null;
  return <ObjectView objectName={name} />;
}

function App() {
  return (
    <BrowserRouter basename="/studio">
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/object/:name" element={<ObjectViewWrapper />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
