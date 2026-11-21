"use client";

import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flag,
  Loader2,
  MinusCircle,
  OctagonAlert,
  Save,
} from "lucide-react";
import type { FormEvent } from "react";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import {
  MUNICIPAL_DEPARTMENTS,
  type IssuePriority,
  type IssueStatus,
  type MunicipalDepartment,
} from "@/types/issue";

const MAX_NOTE_LENGTH = 1000;

const STATUS_OPTIONS: readonly RadioPillOption<IssueStatus>[] = [
  {
    value: "Reported",
    label: "Reported",
    icon: <Flag className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "In Progress",
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "Pending Verification",
    label: "Pending Verification",
    icon: <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#5B21B6] bg-[#5B21B6]",
  },
  {
    value: "Resolved",
    label: "Resolved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#065F46] bg-[#065F46]",
  },
];

const PRIORITY_OPTIONS: readonly RadioPillOption<IssuePriority>[] = [
  {
    value: "Low",
    label: "Low",
    icon: <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#334155] bg-[#334155]",
  },
  {
    value: "Medium",
    label: "Medium",
    icon: <MinusCircle className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#854D0E] bg-[#854D0E]",
  },
  {
    value: "High",
    label: "High",
    icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#9A3412] bg-[#9A3412]",
  },
  {
    value: "Critical",
    label: "Critical",
    icon: <OctagonAlert className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#991B1B] bg-[#991B1B]",
  },
];

const QUICK_FILL_NOTES = [
  "Field crew dispatched",
  "Site inspection in progress",
  "Repair completed & verified",
] as const;

interface ResolutionUpdateFormProps {
  status: IssueStatus;
  onStatusChange: (value: IssueStatus) => void;
  priority: IssuePriority;
  onPriorityChange: (value: IssuePriority) => void;
  department: MunicipalDepartment;
  onDepartmentChange: (value: MunicipalDepartment) => void;
  resolutionNote: string;
  onResolutionNoteChange: (value: string) => void;
  onQuickFill: (template: string) => void;
  saving: boolean;
  error: string | null;
  onSubmit: (event: FormEvent) => void;
}

export function ResolutionUpdateForm({
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  department,
  onDepartmentChange,
  resolutionNote,
  onResolutionNoteChange,
  onQuickFill,
  saving,
  error,
  onSubmit,
}: ResolutionUpdateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      aria-label="Resolution and status update"
      className="space-y-4 border-t border-[#E2E8F0] pt-4"
    >
      <h3 className="font-headline text-sm font-bold text-[#0F172A]">
        Resolution &amp; Status Update
      </h3>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#991B1B]"
        >
          {error}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-[#0F172A]">Update Status</p>
        <RadioPills
          label="Update Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
          disabled={saving}
          className="mt-1.5 grid grid-cols-2 gap-2"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-[#0F172A]">Priority Level</p>
        <RadioPills
          label="Priority Level"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={onPriorityChange}
          disabled={saving}
          className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4"
        />
      </div>

      <div>
        <label
          htmlFor="drawer-department"
          className="block text-xs font-semibold text-[#0F172A]"
        >
          Reassign Department
        </label>
        <select
          id="drawer-department"
          value={department}
          onChange={(e) =>
            onDepartmentChange(e.target.value as MunicipalDepartment)
          }
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-white"
        >
          {MUNICIPAL_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="drawer-resolution-note"
            className="block text-xs font-semibold text-[#0F172A]"
          >
            Public Resolution Note
          </label>
          <span className="text-[11px] tabular-nums text-[#64748B]">
            {resolutionNote.length} / 1,000
          </span>
        </div>

        <div
          role="group"
          aria-label="Quick-fill note templates"
          className="mt-1.5 flex flex-wrap gap-1.5"
        >
          {QUICK_FILL_NOTES.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onQuickFill(text)}
              className="rounded-full border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
            >
              + {text}
            </button>
          ))}
        </div>

        <textarea
          id="drawer-resolution-note"
          rows={4}
          maxLength={MAX_NOTE_LENGTH}
          value={resolutionNote}
          onChange={(e) => onResolutionNoteChange(e.target.value)}
          placeholder="Describe field crew dispatch, inspection findings, or final completion details..."
          className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5 text-sm leading-relaxed text-[#0F172A] focus:bg-white"
        />
        <p className="mt-1 text-[11px] text-[#64748B]">
          Saved directly to the public tracking timeline on the issue page.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002046] disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save &amp; Publish Update
          </>
        )}
      </button>
    </form>
  );
}
