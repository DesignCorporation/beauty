export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="calendar-layout">
      {children}
    </div>
  );
}