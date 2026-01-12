import { NavLink } from 'react-router-dom';
import { useMetadata } from '@/hooks/use-metadata';
import { Database, Home, Loader2, Table2, FileCode, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';


export function Sidebar() {
    const { objects, loading, error } = useMetadata();

    return (
        <div className="w-64 border-r bg-card h-screen flex flex-col">
            <div className="p-6 border-b flex items-center space-x-2">
                <Database className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">ObjectQL Studio</span>
            </div>
            
            <div className="flex-1 overflow-auto py-4">
                <nav className="space-y-1 px-2">
                    <NavLink 
                        to="/" 
                        className={({isActive}) => cn(
                            "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-accent/50 text-accent-foreground"
                        )}
                        end
                    >
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                    </NavLink>

                    <div className="pt-4 px-4 pb-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Development
                        </h4>
                    </div>

                    <NavLink 
                        to="/metadata" 
                        className={({isActive}) => cn(
                            "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-accent/50 text-accent-foreground"
                        )}
                    >
                        <Layers className="h-4 w-4" />
                        <span>Metadata Explorer</span>
                    </NavLink>

                    <NavLink 
                        to="/schema" 
                        className={({isActive}) => cn(
                            "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-accent/50 text-accent-foreground"
                        )}
                    >
                        <FileCode className="h-4 w-4" />
                        <span>Schema Editor</span>
                    </NavLink>

                    <a
                        href="/swagger" 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span>API Docs</span>
                    </a>

                    <div className="pt-4 px-4 pb-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Collections
                        </h4>
                    </div>

                    {loading && (
                        <div className="px-4 py-2 text-sm text-muted-foreground flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-2 text-sm text-red-500">
                           Failed to load
                        </div>
                    )}

                    {!loading && objects.map(obj => (
                        <NavLink
                            key={obj.name}
                            to={`/object/${obj.name}`}
                            className={({isActive}) => cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Table2 className="h-4 w-4" />
                            <span>{obj.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <div className="p-4 border-t text-xs text-center text-muted-foreground">
                v1.3.1
            </div>
        </div>
    );
}
