import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Field {
  name: string;
  type?: string;
  label?: string;
  required?: boolean;
  defaultValue?: any;
}

interface ObjectMetadata {
  name: string;
  label?: string;
  fields?: Field[];
  [key: string]: any;
}

function SchemaInspector() {
  const { objectName } = useParams<{ objectName?: string }>();
  const [objects, setObjects] = useState<ObjectMetadata[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (objectName) {
      fetchObjectDetails(objectName);
    }
  }, [objectName]);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metadata/object');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setObjects(data.items || []);
    } catch (e: any) {
      console.error('Failed to fetch objects:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectDetails = async (name: string) => {
    try {
      const response = await fetch(`/api/metadata/object/${name}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.fields && !Array.isArray(data.fields)) {
        data.fields = Object.values(data.fields);
      }
      setSelectedObject(data);
    } catch (e: any) {
      console.error('Failed to fetch object details:', e);
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading schema...</p>
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

  return (
    <div>
      {objectName && (
        <div className="breadcrumb">
          <Link to="/schema">Schema</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{objectName}</span>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Schema Inspector</h2>
        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
          View object definitions and field metadata
        </p>

        {!objectName ? (
          <div className="grid grid-2">
            {objects.map((obj) => (
              <Link
                key={obj.name}
                to={`/schema/${obj.name}`}
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
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {obj.label || obj.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                    {obj.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : selectedObject ? (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {selectedObject.label || selectedObject.name}
              </h3>
              <p style={{ color: '#718096' }}>API Name: <code>{selectedObject.name}</code></p>
            </div>

            {selectedObject.fields && selectedObject.fields.length > 0 ? (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Fields</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Default Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedObject.fields.map((field) => (
                        <tr key={field.name}>
                          <td><code>{field.name}</code></td>
                          <td>{field.label || '-'}</td>
                          <td>
                            <span className="badge badge-primary">{field.type || 'text'}</span>
                          </td>
                          <td>{field.required ? 'Yes' : 'No'}</td>
                          <td>{field.defaultValue !== undefined ? String(field.defaultValue) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                No field metadata available for this object.
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Raw Definition</h4>
              <pre style={{
                background: '#f7fafc',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0'
              }}>
                {JSON.stringify(selectedObject, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading object details...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaInspector;
