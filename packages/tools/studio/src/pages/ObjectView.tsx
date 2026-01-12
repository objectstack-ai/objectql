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
    // const [rowData, setRowData] = useState<any[]>([]); // Using Server Side
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'data' | 'schema'>('data');
    const [schemaFile, setSchemaFile] = useState<string | null>(null);

    const [gridApi, setGridApi] = useState<any>(null);

    // Initial load for columns
    useEffect(() => {
        const loadColumns = async () => {
             const metaRes = await fetch('/api/metadata');
             const meta = await metaRes.json();
             const objects = Array.isArray(meta) ? meta : meta.objects;
             const currentObj = objects.find((o: any) => o.name === objectName);

             if (currentObj) {
                 const cols: ColDef[] = [
                     { field: 'id', headerName: 'ID', width: 100, pinned: 'left', filter: 'agTextColumnFilter' }
                 ];
                 
                 Object.entries(currentObj.fields).forEach(([key, field]: [string, any]) => {
                     cols.push({
                         field: key,
                         headerName: field.label || key,
                         flex: 1,
                         filter: 'agTextColumnFilter', // Enforce text filter for simplicity in Infinite Model
                         filterParams: {
                            filterOptions: ['contains', 'equals'],
                            suppressAndOrCondition: true
                         }
                     });
                 });
                 
                 setColumnDefs(cols);
             }
        };
        loadColumns();
    }, [objectName]);

    const onGridReady = (params: any) => {
        setGridApi(params.api);
        setLoading(true);
        
        const datasource = {
            getRows: async (params: any) => {
                const { startRow, endRow, filterModel, sortModel } = params;
                setLoading(true);
                
                try {
                    // 1. Convert Filters
                    const filters: any[] = [];
                    if (filterModel) {
                        for (const key of Object.keys(filterModel)) {
                            const model = filterModel[key];
                            // agTextColumnFilter model: { filterType: 'text', type: 'contains', filter: 'value' }
                            if (model.filterType === 'text') {
                                if (model.type === 'contains') {
                                    filters.push([key, 'contains', model.filter]);
                                } else if (model.type === 'equals') {
                                    filters.push([key, '=', model.filter]);
                                }
                            }
                        }
                    }

                    // 2. Convert Sort
                    const sort = sortModel.map((s: any) => [s.colId, s.sort]);

                    // 3. Fetch Data
                    const response = await fetch('/api/objectql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            op: 'find',
                            object: objectName,
                            args: {
                                skip: startRow,
                                limit: endRow - startRow,
                                filters: filters.length > 0 ? filters : undefined,
                                sort: sort.length > 0 ? sort : undefined
                            }
                        })
                    });
                    const resJson = await response.json();
                    const rows = resJson.data || resJson; // normalize

                    // 4. Fetch Count (for total pagination)
                    // Optimization: Only fetch count if we don't know it or filter changed? 
                    // For Infinite Scroll simplicity, we fetch it.
                    let lastRow = -1;
                    if (rows.length < (endRow - startRow)) {
                        lastRow = startRow + rows.length;
                    } else {
                         const countRes = await fetch('/api/objectql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                op: 'count',
                                object: objectName,
                                args: filters.length > 0 ? filters : {}
                            })
                        });
                        const countJson = await countRes.json();
                        lastRow = typeof countJson === 'number' ? countJson : countJson.data;
                    }

                   params.successCallback(rows, lastRow);

                } catch (e) {
                    console.error('Datasource getRows error:', e);
                    params.failCallback();
                } finally {
                    setLoading(false);
                }
            }
        };

        params.api.setDatasource(datasource);
    };

    const refreshData = () => {
        if (gridApi) {
            gridApi.refreshInfiniteCache();
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
        if (activeTab === 'schema') {
            fetchSchemaFile();
        }
    }, [objectName, activeTab]);


    const defaultColDef = useMemo(() => {
        return {
            sortable: true,
            filter: true,
            resizable: true,
            floatingFilter: true, // Enable Floating Filter
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
                        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
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
                                rowModelType="infinite"
                                onGridReady={onGridReady}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                pagination={true}
                                paginationPageSize={20}
                                cacheBlockSize={20}
                                rowSelection="multiple"
                                maxBlocksInCache={10}
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
