import { useMetadata } from '@/hooks/use-metadata';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export function Dashboard() {
    const { objects } = useMetadata();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Collections</CardTitle>
                        <CardDescription>Registered objects in schema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{objects.length}</div>
                    </CardContent>
                </Card>

                {objects.map(obj => (
                    <Card key={obj.name} className="hover:bg-accent/10 transition-colors">
                        <CardHeader>
                            <CardTitle>{obj.name}</CardTitle>
                            <CardDescription className="truncate">{obj.description || 'No description'}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">{Object.keys(obj.fields).length} fields</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
