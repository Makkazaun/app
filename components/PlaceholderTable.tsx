interface PlaceholderTableProps {
  columns: string[]
  rows: React.ReactNode[][]
  emptyMessage?: string
}

export default function PlaceholderTable({ columns, rows, emptyMessage }: PlaceholderTableProps) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #1A0005' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#0D0003', borderBottom: '1px solid #1A0005' }}>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: '#C88090', letterSpacing: '0.1em' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm"
                  style={{ color: '#C08898' }}
                >
                  {emptyMessage ?? 'Keine Einträge'}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}
                  style={{
                    background: i % 2 === 0 ? '#33000D' : '#080002',
                    borderBottom: i < rows.length - 1 ? '1px solid #440011' : 'none',
                  }}
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
