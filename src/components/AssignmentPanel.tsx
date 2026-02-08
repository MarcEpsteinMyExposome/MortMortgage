import { useState } from 'react'
import CaseworkerSelect from './CaseworkerSelect'

interface AssignmentPanelProps {
  applicationId: string
  assignedTo: { id: string; name: string; email: string } | null
  assignedAt: string | null
  priority: string
  slaDeadline: string | null
  onUpdate: () => void
}

export default function AssignmentPanel({
  applicationId,
  assignedTo,
  assignedAt,
  priority,
  slaDeadline,
  onUpdate
}: AssignmentPanelProps) {
  const [selectedCw, setSelectedCw] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showReassign, setShowReassign] = useState(false)

  async function handleAssign() {
    if (!selectedCw) return
    setAssigning(true)
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, assignedToId: selectedCw })
      })
      if (res.ok) {
        setShowReassign(false)
        setSelectedCw('')
        onUpdate()
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign() {
    setAssigning(true)
    try {
      const res = await fetch(`/api/admin/assignments/${applicationId}`, {
        method: 'DELETE'
      })
      if (res.ok) onUpdate()
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Assignment</h3>
      {assignedTo ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
              {(assignedTo.name || '?').charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{assignedTo.name}</div>
              <div className="text-xs text-gray-500">
                Assigned {assignedAt ? new Date(assignedAt).toLocaleDateString() : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showReassign ? (
              <>
                <CaseworkerSelect value={selectedCw} onChange={setSelectedCw} disabled={assigning} />
                <button
                  onClick={handleAssign}
                  disabled={!selectedCw || assigning}
                  className="btn btn-sm btn-primary disabled:opacity-50"
                >
                  {assigning ? '...' : 'Reassign'}
                </button>
                <button onClick={() => setShowReassign(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowReassign(true)} className="btn btn-sm btn-ghost">
                  Reassign
                </button>
                <button
                  onClick={handleUnassign}
                  disabled={assigning}
                  className="btn btn-sm btn-ghost text-danger-600"
                >
                  Unassign
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Not assigned</span>
          <CaseworkerSelect value={selectedCw} onChange={setSelectedCw} disabled={assigning} />
          <button
            onClick={handleAssign}
            disabled={!selectedCw || assigning}
            className="btn btn-sm btn-primary disabled:opacity-50"
          >
            {assigning ? '...' : 'Assign'}
          </button>
        </div>
      )}
    </div>
  )
}
