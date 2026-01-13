import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Record {
  _id?: string;
  id?: string;
  [key: string]: any;
}

function RecordDetail() {
  const { objectName, recordId } = useParams<{ objectName: string; recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record>({});

  useEffect(() => {
    fetchRecord();
  }, [objectName, recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/objectql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'findOne',
          object: objectName,
          args: {
            filters: [['_id', '=', recordId]].concat(
              recordId ? [['id', '=', recordId]] : []
            )
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // For findOne, the result is the record itself (no data wrapper)
      const recordData = result.data || result;
      setRecord(recordData);
      setFormData(recordData || {});
    } catch (e: any) {
      console.error('Failed to fetch record:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/objectql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'update',
          object: objectName,
          args: {
            id: recordId,
            data: formData
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      setEditing(false);
      fetchRecord();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch('/api/objectql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'delete',
          object: objectName,
          args: { id: recordId }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      navigate(`/object/${objectName}`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading record...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div>
        <div className="breadcrumb">
          <Link to="/">Objects</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/object/${objectName}`}>{objectName}</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{recordId}</span>
        </div>
        <div className="alert alert-error">
          <strong>Error:</strong> {error || 'Record not found'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">Objects</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to={`/object/${objectName}`}>{objectName}</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{recordId}</span>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Record Detail</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
                <button className="btn btn-secondary" onClick={() => {
                  setEditing(false);
                  setFormData(record);
                }}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="form-group">
                <label className="form-label">{key}</label>
                {typeof value === 'object' && value !== null ? (
                  <textarea
                    className="form-textarea"
                    value={JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, [key]: JSON.parse(e.target.value) });
                      } catch {
                        // Invalid JSON, keep as string
                      }
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={String(value || '')}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    disabled={key === '_id' || key === 'id'}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(record).map(([key, value]) => (
                  <tr key={key}>
                    <td><strong>{key}</strong></td>
                    <td style={{ whiteSpace: 'pre-wrap', fontFamily: typeof value === 'object' ? 'monospace' : 'inherit' }}>
                      {formatValue(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecordDetail;
