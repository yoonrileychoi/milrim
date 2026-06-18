export function LogoBars({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 52 }}>
        <div style={{ width: 12, height: 24, background: '#9CC36B', borderRadius: '6px 6px 2px 2px' }} />
        <div style={{ width: 12, height: 38, background: '#6E9E4E', borderRadius: '6px 6px 2px 2px' }} />
        <div style={{ width: 12, height: 52, background: '#2E5A3A', borderRadius: '6px 6px 2px 2px' }} />
        <div style={{ width: 12, height: 35, background: '#6E9E4E', borderRadius: '6px 6px 2px 2px' }} />
        <div style={{ width: 12, height: 22, background: '#9CC36B', borderRadius: '6px 6px 2px 2px' }} />
      </div>
    )
  }
  if (size === 'sm') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }}>
        <div style={{ width: 5, height: 9, background: '#9CC36B', borderRadius: 2 }} />
        <div style={{ width: 5, height: 15, background: '#6E9E4E', borderRadius: 2 }} />
        <div style={{ width: 5, height: 20, background: '#2E5A3A', borderRadius: 2 }} />
        <div style={{ width: 5, height: 13, background: '#6E9E4E', borderRadius: 2 }} />
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 26 }}>
      <div style={{ width: 6, height: 12, background: '#9CC36B', borderRadius: '3px 3px 1px 1px' }} />
      <div style={{ width: 6, height: 20, background: '#6E9E4E', borderRadius: '3px 3px 1px 1px' }} />
      <div style={{ width: 6, height: 26, background: '#2E5A3A', borderRadius: '3px 3px 1px 1px' }} />
      <div style={{ width: 6, height: 17, background: '#6E9E4E', borderRadius: '3px 3px 1px 1px' }} />
      <div style={{ width: 6, height: 10, background: '#9CC36B', borderRadius: '3px 3px 1px 1px' }} />
    </div>
  )
}
