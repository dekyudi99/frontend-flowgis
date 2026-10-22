import React, { useState } from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { useTranslation } from 'react-i18next'; 
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import GroupMemberList from './GroupMemberList';
import { isLayerInAnyGroup } from '@/lib/wmsHelper';

const GeosocialLayers = ({
  layerList = [],
  visibleLayers = {},
  onToggle,
  onToggleAll,
  groupList = [],
  visibleGroups = {},
  onToggleGroup,
  onToggleGroupMember
}) => {
  const { t } = useTranslation();
  // Sub-layers are open/visible by default so users see them immediately
  const [collapsedGroupIds, setCollapsedGroupIds] = useState({});

  // Filter out standalone layers that already belong to any layer group
  const standaloneLayers = layerList.filter((layer) => !isLayerInAnyGroup(layer, groupList));

  const totalItems = standaloneLayers.length + groupList.length;

  if (totalItems === 0) {
    return (
      <div className="text-xs text-gray-400 italic px-2 py-1">
        Loading layers...
      </div>
    );
  }

  const isAllChecked =
    totalItems > 0 &&
    standaloneLayers.every((layer) => visibleLayers[layer.id]) &&
    groupList.every((group) => visibleGroups[group.id]);

  const handleToggleSelectAll = (checked) => {
    if (onToggleAll) {
      onToggleAll(checked, standaloneLayers, groupList);
    }
  };

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <section className="px-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar"> 
      {/* Select All */}
      <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
        <Checkbox 
          id="geo-all"
          checked={isAllChecked}
          onCheckedChange={handleToggleSelectAll}
          className="mr-3"
        />
        <Label 
          htmlFor="geo-all" 
          className="text-sm font-bold cursor-pointer select-none text-teal-700"
        >
          {t('geoLayers.selectAll', 'Select All Layers')} 
        </Label>
      </div>

      {/* Unified List: Groups and Standalone Layers combined without separation */}
      <div className="ml-1 flex flex-col gap-2">
        {/* Layer Groups */}
        {groupList.map((group) => {
          const isActive = !!visibleGroups[group.id];
          const isCollapsed = !!collapsedGroupIds[group.id];
          const memberCount = group.layers?.length || group.layer_count || 0;

          return (
            <div
              key={group.id}
              className={`p-2 rounded-lg border transition-all duration-150 ${
                isActive
                  ? 'bg-purple-50/50 border-purple-200 shadow-xs'
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1 mr-2">
                  <Checkbox
                    id={`geo-group-${group.id}`}
                    checked={isActive}
                    onCheckedChange={(checked) => onToggleGroup && onToggleGroup(group, checked)}
                    className="mr-2.5 shrink-0"
                  />
                  <Label
                    htmlFor={`geo-group-${group.id}`}
                    className="text-xs cursor-pointer select-none text-gray-800 truncate font-semibold flex items-center gap-1.5"
                    title={group.title || group.name}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{group.title || group.name}</span>
                  </Label>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {memberCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.id)}
                      title={isCollapsed ? 'Show sub-layers' : 'Hide sub-layers'}
                      className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase bg-purple-50 text-purple-600 border border-purple-200/60">
                    {memberCount} layers
                  </span>
                </div>
              </div>

              {/* Sub-layers: Visible by default */}
              {!isCollapsed && memberCount > 0 && (
                <GroupMemberList
                  group={group}
                  isGroupActive={isActive}
                  hiddenLayerIds={visibleGroups[group.id]?.hidden_layer_ids}
                  onToggleMember={onToggleGroupMember}
                  onToggleGroup={onToggleGroup}
                  layerCatalog={layerList}
                />
              )}
            </div>
          );
        })}

        {/* Standalone Layers (layers not inside any group) */}
        {standaloneLayers.map((layer) => {
          const isChecked = !!visibleLayers[layer.id];
          const labelText = layer.display_name || layer.name || layer.layer_name;
          const isWms =
            layer.type === 'wms' ||
            (layer.url && (layer.url.includes('/wms') || layer.url.includes('/geoserver/'))) ||
            (layer.layer_name && (layer.layer_name.includes(':') || layer.layer_name.startsWith('ws_')));

          return (
            <div
              key={layer.id}
              className={`flex items-center justify-between p-1.5 rounded-lg border transition-all duration-150 ${
                isChecked
                  ? 'bg-teal-50/50 border-teal-200 shadow-xs'
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center min-w-0 flex-1 mr-2">
                <Checkbox 
                  id={`geo-${layer.id}`} 
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(layer.id, checked)}
                  className="mr-2.5 shrink-0" 
                />
                <Label 
                  htmlFor={`geo-${layer.id}`} 
                  className="text-xs cursor-pointer select-none text-gray-700 truncate font-medium"
                  title={labelText}
                >
                  {labelText}
                </Label>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                  isWms 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                }`}
              >
                {isWms ? 'WMS' : 'Points'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GeosocialLayers;