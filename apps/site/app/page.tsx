export default function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">ObjectQL Documentation</h1>
      <p className="text-lg text-muted-foreground">
        Visit <a href="/docs" className="text-blue-600 hover:underline">/docs</a> to view the documentation
      </p>
    </main>
  );
}
