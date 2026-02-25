export default function LoadingSpinner({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}