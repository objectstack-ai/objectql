import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileJson, Layers, Shield, FileText, Activity, Layout, AlertTriangle, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format JSON
function JsonViewer({ data }: { data: any }) {
    return (
        <pre className="bg-muted p-4 rounded-md overflow-auto text-xs font-mono max-h-[600px]">
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}

const METADATA_TYPES = [
    { id: 'objects', label: 'Objects', icon: Layers },
    { id: 'view', label: 'Views', icon: Layout },
    { id: 'permission', label: 'Permissions', icon: Shield },
    { id: 'report', label: 'Reports', icon: FileText },
    { id: 'validation', label: 'Validations', icon: AlertTriangle },
    { id: 'workflow', label: 'Workflows', icon: Workflow },
    { id: 'form', label: 'Forms', icon: Activity },
    { id: 'app', label: 'Apps', icon: FileJson },
];

export function MetadataBrowser() {
    // State
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    
    const [items, setItems] = useState<any[]>([]);
    const [itemDetail, setItemDetail] = useState<any>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch list when type changes
    useEffect(() => {
        if (!selectedType) return;

        setLoading(true);
        setItems([]);
        setSelectedItem(null);
        setError(null);

        fetch(`/api/metadata/${selectedType}`)
            .then(async res => {
                if (!res.ok) throw new Error(`Failed to fetch ${selectedType}`);
                const data = await res.json();
                // API returns { [type]: [...] }
                const list = data[selectedType] || data.objects || []; 
                setItems(list);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

    }, [selectedType]);

    // Fetch detail when item changes
    useEffect(() => {
        if (!selectedType || !selectedItem) return;

        setLoading(true);
        setItemDetail(null);
        setError(null);

        // For objects, the ID is the name. For others, it relies on file structure or id
        fetch(`/api/metadata/${selectedType}/${selectedItem}`)
            .then(async res => {
                if (!res.ok) throw new Error(`Failed to fetch detail for ${selectedItem}`);
                const data = await res.json();
                setItemDetail(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

    }, [selectedType, selectedItem]);

    // --- Render: Main Menu (Type Selection) ---
    if (!selectedType) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Metadata Registry</h1>
                <p className="text-muted-foreground mb-8">
                    Browse the active runtime metadata loaded in the ObjectQL engine.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {METADATA_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Card 
                                key={type.id} 
                                className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/50"
                                onClick={() => setSelectedType(type.id)}
                            >
                                <CardHeader className="flex flex-row items-center space-y-0 space-x-4">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">{type.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Browse {type.label.toLowerCase()} definitions
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- Render: List or Detail ---
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Left Panel: List */}
            <div className="w-1/3 border-r bg-card flex flex-col">
                <div className="p-4 border-b flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold text-lg capitalize">{selectedType} List</h2>
                </div>
                
                 <div className="flex-1 overflow-auto p-2 space-y-2">
                    {error && (
                        <div className="p-4 text-sm text-red-500 bg-red-50 rounded mb-2">
                            Error: {error}
                        </div>
                    )}

                    {loading && items.length === 0 && (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
                        </div>
                    )}

                    {!loading && items.map((item: any) => {
                        const id = item.name || item.id;
                        return (
                            <div 
                                key={id}
                                onClick={() => setSelectedItem(id)}
                                className={cn(
                                    "p-3 rounded-md cursor-pointer text-sm font-medium transition-colors border",
                                    selectedItem === id 
                                        ? "bg-primary text-primary-foreground border-primary" 
                                        : "hover:bg-accent border-transparent"
                                )}
                            >   
                                <div className="flex justify-between items-center">
                                    <span>{item.label || item.name}</span>
                                    {item.name !== item.label && (
                                        <span className="text-xs opacity-70 ml-2 font-mono">({item.name})</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {!loading && items.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground text-sm">
                            No {selectedType} found.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Detail */}
            <div className="flex-1 bg-muted/20 flex flex-col h-full overflow-hidden">
                {!selectedItem ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select an item to view details
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                         <div className="p-4 border-b bg-card">
                             <h2 className="text-xl font-bold">{selectedItem}</h2>
                         </div>
                         <div className="flex-1 overflow-auto p-6">
                            {loading && !itemDetail ? (
                                <div className="flex items-center text-muted-foreground">
                                     <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading details...
                                </div>
                            ) : (
                                <JsonViewer data={itemDetail} />
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MetadataBrowser;
