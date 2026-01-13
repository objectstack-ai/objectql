import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Record {
  _id?: string;
  id?: string;
  [key: string]: any;
}

function DataGrid() {
  const { objectName } = useParams<{ objectName: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchObjectMetadata();
  }, [objectName]);

  const fetchObjectMetadata = async () => {
    try {
      const response = await fetch(`/api/metadata/object/${objectName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.fields) {
          const fieldsArray = Array.isArray(data.fields) ? data.fields : Object.values(data.fields);
          setFields(fieldsArray.map((f: any) => f.name || f));
        }
      }
    } catch (e) {
      console.error('Failed to fetch metadata:', e);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/objectql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'find',
          object: objectName,
          args: { limit: 100 }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.items || result.data || [];
      setRecords(data);

      // Auto-detect fields if not already set
      if (data.length > 0 && fields.length === 0) {
        const sampleRecord = data[0];
        const detectedFields = Object.keys(sampleRecord).filter(
          k => !k.startsWith('_') || k === '_id'
        );
        setFields(detectedFields);
      }
    } catch (e: any) {
      console.error('Failed to fetch records:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: Record) => {
    try {
      const response = await fetch('/api/objectql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'create',
          object: objectName,
          args: { data: formData }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create record');
      }

      setShowCreateForm(false);
      fetchRecords();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const getRecordId = (record: Record): string => {
    return record._id || record.id || '';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading records...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">Objects</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{objectName}</span>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>{objectName}</h2>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'New Record'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {showCreateForm && (
          <CreateRecordForm
            fields={fields}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {records.length === 0 ? (
          <div className="alert alert-info">
            No records found. Click "New Record" to create one.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={getRecordId(record) || idx}>
                    {fields.map((field) => (
                      <td key={field}>{formatValue(record[field])}</td>
                    ))}
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/object/${objectName}/${getRecordId(record)}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '1rem', color: '#718096', fontSize: '0.875rem' }}>
          Showing {records.length} record{records.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

function CreateRecordForm({ fields, onSubmit, onCancel }: {
  fields: string[];
  onSubmit: (data: Record) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Record>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ background: '#f7fafc', marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Create New Record</h3>
      {fields.filter(f => f !== '_id' && f !== 'id').map((field) => (
        <div key={field} className="form-group">
          <label className="form-label">{field}</label>
          <input
            type="text"
            className="form-input"
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary">Create</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default DataGrid;
