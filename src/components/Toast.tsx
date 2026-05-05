type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      className="fixed left-1/2 top-24 z-[80] -translate-x-1/2 rounded-full border border-white/30 bg-slate-950/72 px-4 py-2 text-sm font-bold text-white shadow-[0_18px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      role="status"
      data-testid="status-toast"
    >
      {message}
    </div>
  );
}
