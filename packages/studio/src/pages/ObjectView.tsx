import { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

interface ObjectViewProps {
    objectName: string;
}

export function ObjectView({ objectName }: ObjectViewProps) {
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Schema to build columns
            // Ideally we should cache metadata, but fetching it here is safer for now
            const metaRes = await fetch('/api/metadata');
            const meta = await metaRes.json();
            const objects = Array.isArray(meta) ? meta : meta.objects;
            const currentObj = objects.find((o: any) => o.name === objectName);

            if (currentObj) {
                const cols: ColDef[] = [
                    { field: 'id', headerName: 'ID', width: 100, pinned: 'left' }
                ];
                
                Object.entries(currentObj.fields).forEach(([key, field]: [string, any]) => {
                    cols.push({
                        field: key,
                        headerName: field.label || key,
                        flex: 1,
                        filter: true
                    });
                });
                
                // Add system fields if not present
                if (!cols.find(c => c.field === 'createdAt')) cols.push({ field: 'createdAt', hide: true });
                if (!cols.find(c => c.field === 'updatedAt')) cols.push({ field: 'updatedAt', hide: true });

                setColumnDefs(cols);
            }

            // 2. Fetch Data
            const res = await fetch(`/api/objectql/${objectName}`);
            const data = await res.json();
            setRowData(Array.isArray(data) ? data : []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [objectName]);

    const defaultColDef = useMemo(() => {
        return {
            sortable: true,
            filter: true,
            resizable: true,
        };
    }, []);

    return (
        <div className="h-full flex flex-col space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{objectName}</h2>
                    <p className="text-muted-foreground">Manage {objectName} records</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </div>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden bg-card" style={{opacity: loading ? 0.6 : 1}}>
                {/* Ag-Grid Container */}
                <div className="ag-theme-quartz h-full w-full">
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        paginationPageSize={20}
                        rowSelection="multiple"
                    />
                </div>
            </div>
        </div>
    );
}
