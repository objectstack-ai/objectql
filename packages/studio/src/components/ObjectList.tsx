import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ObjectInfo {
  name: string;
  label?: string;
  icon?: string;
  recordCount?: number;
}

function ObjectList() {
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metadata/objects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setObjects(data.objects || []);
    } catch (e: any) {
      console.error('Failed to fetch objects:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading objects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">No Objects Found</h2>
        <p>No objects are registered in the ObjectQL instance.</p>
        <p className="alert alert-info" style={{ marginTop: '1rem' }}>
          Make sure your ObjectQL server has loaded object definitions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Database Objects</h2>
        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
          Browse and manage data across all registered objects
        </p>

        <div className="grid grid-2">
          {objects.map((obj) => (
            <Link
              key={obj.name}
              to={`/object/${obj.name}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e2e8f0',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {obj.icon || obj.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {obj.label || obj.name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                      {obj.name}
                      {typeof obj.recordCount === 'number' && (
                        <span> • {obj.recordCount} records</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ObjectList;
