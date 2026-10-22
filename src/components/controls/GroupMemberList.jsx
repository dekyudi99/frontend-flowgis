import React from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { resolveMemberDisplayName } from '@/lib/wmsHelper';

/**
 * Renders sub-layers of a Layer Group with checkboxes.
 * Each sub-layer shows its user-friendly display name resolved from the catalog.
 */
export default function GroupMemberList({
  group,
  isGroupActive = false,
  hiddenLayerIds = [],
  onToggleMember,
  onToggleGroup,
  layerCatalog = [],
}) {
  const members = (Array.isArray(group?.layers) && group.layers.length > 0)
    ? group.layers
    : (Array.isArray(group?.layer_ids) && group.layer_ids.length > 0)
      ? group.layer_ids.map((id) => (typeof id === 'object' ? id : { id }))
      : [];
  if (members.length === 0) return null;

  const hidden = new Set(hiddenLayerIds.map(String));

  const getMemberId = (member, idx) =>
    String(member?.id ?? member?.layer_id ?? member?.geoserver_name ?? member?.layer_name ?? idx);

  const handleMemberChange = (memberId, checked) => {
    const memberIdStr = String(memberId);
    if (!isGroupActive) {
      if (checked) {
        // Jika group sedang mati lalu salah satu sub-layer diklik:
        // Otomatis aktifkan layer group, TETAPI hanya sub-layer yang diklik ini saja yang aktif.
        // Semua sub-layer lain diset sebagai hidden_layer_ids.
        const allOtherMemberIds = members
          .map((m, idx) => getMemberId(m, idx))
          .filter((id) => id !== memberIdStr);

        if (onToggleGroup) {
          onToggleGroup(group, true, allOtherMemberIds);
        } else if (onToggleMember) {
          onToggleMember(group, memberId, true);
        }
      }
    } else {
      if (onToggleMember) {
        onToggleMember(group, memberId, checked);
      }
    }
  };

  return (
    <div className="mt-1.5 pt-1.5 border-t border-gray-100 pl-4 pr-1 space-y-1">
      {members.map((member, idx) => {
        const memberId = member.id ?? member.layer_id ?? member.geoserver_name ?? member.layer_name ?? idx;
        const memberIdStr = String(memberId);
        const inputId = `group-${group.id}-member-${memberIdStr}`;
        const label = resolveMemberDisplayName(member, layerCatalog);
        const isMemberChecked = Boolean(isGroupActive && !hidden.has(memberIdStr));

        return (
          <div
            key={memberIdStr}
            className={`flex items-center justify-between p-1 rounded-md transition-colors ${
              isGroupActive ? 'hover:bg-gray-50/80' : 'opacity-60'
            }`}
          >
            <div className="flex items-center min-w-0 flex-1 mr-2">
              <Checkbox
                id={inputId}
                checked={isMemberChecked}
                onCheckedChange={(checked) => handleMemberChange(memberId, Boolean(checked))}
                className="mr-2 shrink-0 scale-90"
              />
              <Label
                htmlFor={inputId}
                title={label}
                className={`text-[11px] truncate select-none font-normal cursor-pointer ${
                  isGroupActive ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </Label>
            </div>
            <span
              className={`text-[9px] px-1 py-0.2 rounded border shrink-0 font-medium ${
                isGroupActive
                  ? 'text-teal-600 bg-teal-50 border-teal-100/60'
                  : 'text-gray-400 bg-gray-50 border-gray-200/60'
              }`}
            >
              Sub-layer
            </span>
          </div>
        );
      })}
    </div>
  );
}
