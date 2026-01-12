import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface FileEditorProps {
    filePath: string;
    className?: string;
    onSaveSuccess?: () => void;
}

export function FileEditor({ filePath, className, onSaveSuccess }: FileEditorProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (filePath) {
            loadFile(filePath);
        }
    }, [filePath]);

    const loadFile = async (file: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/schema/content?file=${encodeURIComponent(file)}`);
            if (!res.ok) throw new Error('Failed to load file');
            const text = await res.text();
            setContent(text);
        } catch (e) {
            console.error(e);
            setError('Failed to read file content');
        } finally {
            setLoading(false);
        }
    };

    const saveFile = async () => {
        if (!filePath) return;
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch(`/api/schema/content?file=${encodeURIComponent(filePath)}`, {
                method: 'POST',
                body: content
            });
            if (!res.ok) throw new Error('Failed to save');
            setStatus('File saved successfully!');
            setTimeout(() => setStatus(null), 3000);
            if (onSaveSuccess) onSaveSuccess();
        } catch (e) {
            setError('Failed to save file');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className={`flex flex-col h-full ${className}`}>
            <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b space-y-0 min-h-[50px]">
                <CardTitle className="text-sm font-mono text-muted-foreground flex items-center">
                    {filePath}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {status && <span className="text-xs text-green-600 font-medium animate-fade-in">{status}</span>}
                    {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
                    <Button size="sm" onClick={saveFile} disabled={saving || loading}>
                        {saving ? 'Saving...' : (
                            <>
                                <Save className="mr-2 h-3 w-3" /> Save
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 transition-all backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                <textarea
                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-muted/10 leading-normal"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                    disabled={loading}
                />
            </CardContent>
        </Card>
    );
}
