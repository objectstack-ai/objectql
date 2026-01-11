import { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Table2, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileEditor } from '@/components/FileEditor';

interface ObjectViewProps {
    objectName: string;
}

export function ObjectView({ objectName }: ObjectViewProps) {
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'data' | 'schema'>('data');
    const [schemaFile, setSchemaFile] = useState<string | null>(null);

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

    const fetchSchemaFile = async () => {
        // If we already have the file for this object, don't re-fetch unless objectName changed
        // But here we rely on useEffect deps
        try {
            const res = await fetch(`/api/schema/find?object=${objectName}`);
            if (res.ok) {
                const data = await res.json();
                setSchemaFile(data.file);
            } else {
                setSchemaFile(null);
                console.error('Failed to find schema file');
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        setActiveTab('data');
    }, [objectName]);

    useEffect(() => {
        if (activeTab === 'data') {
            fetchData();
        } else {
            fetchSchemaFile();
        }
    }, [objectName, activeTab]);

    const defaultColDef = useMemo(() => {
        return {
            sortable: true,
            filter: true,
            resizable: true,
        };
    }, []);

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-card text-card-foreground">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight capitalize">{objectName}</h1>
                    <div className="flex space-x-1">
                         <button
                            onClick={() => setActiveTab('data')}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                activeTab === 'data' 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Table2 className="h-4 w-4" />
                            <span>Data</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('schema')}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                activeTab === 'schema' 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <FileCode className="h-4 w-4" />
                            <span>Schema</span>
                        </button>
                    </div>
                </div>
                
                {activeTab === 'data' && (
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            New Record
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6 bg-muted/20">
                {activeTab === 'data' ? (
                     <div className="rounded-md overflow-hidden bg-card h-full" style={{opacity: loading ? 0.6 : 1}}>
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
                ) : (
                    <div className="h-full bg-card rounded-md border">
                        {schemaFile ? (
                            <FileEditor filePath={schemaFile} className="h-full border-0" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                {loading ? 'Loading schema...' : 'Could not find definition file for this object.'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
