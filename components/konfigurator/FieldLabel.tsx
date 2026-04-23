export default function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider mb-3"
      style={{ color: '#C88090', letterSpacing: '0.12em' }}
    >
      {children}
      {required && <span style={{ color: '#800020' }}> *</span>}
    </p>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
      {children}
    </h3>
  )
}

export function inputStyle(focused = false): React.CSSProperties {
  return {
    background: '#3A000F',
    border: `1px solid ${focused ? '#800020' : '#700020'}`,
    color: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '15px',
    width: '100%',
    outline: 'none',
    boxShadow: focused ? '0 0 0 3px rgba(128,0,32,0.08)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
}
