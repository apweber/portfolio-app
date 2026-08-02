"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { patch, del } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";

const STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

interface Props {
  jobId: string;
  initialStatus: string;
  initialNotes: string;
}

export function JobDetailClient({ jobId, initialStatus, initialNotes }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      await patch(`/api/jobs/${jobId}`, { status: newStatus });
      show({ variant: "success", message: "Status updated." });
    } catch {
      setStatus(initialStatus);
      show({ variant: "error", message: "Failed to update status." });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await patch(`/api/jobs/${jobId}`, { notes });
      show({ variant: "success", message: "Notes saved." });
      setEditingNotes(false);
    } catch {
      show({ variant: "error", message: "Failed to save notes." });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await del(`/api/jobs/${jobId}`);
      show({ variant: "success", message: "Job deleted." });
      router.push("/jobs");
    } catch {
      show({ variant: "error", message: "Failed to delete job." });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status-select"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
          {!editingNotes && (
            <Button variant="secondary" size="sm" onClick={() => setEditingNotes(true)}>
              Edit
            </Button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Interview notes, contacts, follow-ups…"
              aria-label="Notes"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? "Saving…" : "Save Notes"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setNotes(initialNotes); setEditingNotes(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {notes || <span className="italic text-gray-400">No notes yet.</span>}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete Job"}
        </Button>
      </div>
    </div>
  );
}
