import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { Book } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const tree = source.getPageTree();
  
  const protocolLink = {
    type: 'page' as const,
    name: 'Protocol Specs',
    url: 'https://protocol.objectstack.ai',
    external: true,
    icon: <Book className="size-4" />
  };

  const modifiedTree = {
    ...tree,
    children: [...tree.children]
  };

  // Find 'Reference' to insert before
  const refIndex = modifiedTree.children.findIndex(n => n.name === 'Reference');
  
  if (refIndex !== -1) {
    modifiedTree.children.splice(refIndex, 0, protocolLink as any);
  } else {
    // If not found, try to find 'Ai' or 'AI'
    const aiIndex = modifiedTree.children.findIndex(n => n.name === 'Ai' || n.name === 'AI');
    if (aiIndex !== -1) {
       modifiedTree.children.splice(aiIndex + 1, 0, protocolLink as any);
    } else {
       modifiedTree.children.push(protocolLink as any);
    }
  }

  return (
    <DocsLayout tree={modifiedTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
