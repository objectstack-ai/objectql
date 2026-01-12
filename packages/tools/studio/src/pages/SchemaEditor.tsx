import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileCode, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileEditor } from '@/components/FileEditor';

export function SchemaEditor() {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/schema/files');
            if (!res.ok) throw new Error('Failed to fetch files');
            const data = await res.json();
            setFiles(data.files || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load file list');
        }
    };

    return (
        <div className="flex h-full flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Schema Editor</h2>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={fetchFiles}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[500px]">
                {/* File List */}
                <Card className="md:col-span-1 flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">Files</CardTitle>
                        <CardDescription>Select a schema file to edit</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-2">
                        <div className="space-y-1">
                            {files.map(file => (
                                <button
                                    key={file}
                                    onClick={() => setSelectedFile(file)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center",
                                        selectedFile === file 
                                            ? "bg-primary text-primary-foreground font-medium" 
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <FileCode className="mr-2 h-4 w-4 opacity-70" />
                                    {file}
                                </button>
                            ))}
                            {files.length === 0 && (
                                <div className="text-sm text-muted-foreground p-2">No schema files found</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Editor */}
                <div className="md:col-span-3 h-full">
                    {selectedFile ? (
                        <FileEditor filePath={selectedFile} />
                    ) : (
                        <Card className="h-full flex items-center justify-center">
                            <div className="text-muted-foreground">Select a file to view content</div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
