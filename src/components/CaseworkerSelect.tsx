import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface CaseworkerSelectProps {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export default function CaseworkerSelect({ value, onChange, disabled }: CaseworkerSelectProps) {
  const { data: caseworkers } = useSWR('/api/admin/caseworkers', fetcher)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input w-auto text-sm"
    >
      <option value="">Select Caseworker...</option>
      {caseworkers?.map((cw: any) => (
        <option key={cw.id} value={cw.id} disabled={!cw.active}>
          {cw.name} ({cw.activeQueue} active){!cw.active ? ' [Inactive]' : ''}
        </option>
      ))}
    </select>
  )
}
