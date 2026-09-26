import React, { useState } from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { 
  RefreshCw, 
  Layers, 
  FolderPlus, 
  Maximize2, 
  Calendar, 
  Trash2, 
  Edit3,
  Check, 
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/context/NotificationContext';
import ConfirmModal from '../popups/ConfirmModal';

export default function UserAnalysisLayers({
  layerList = [],
  groupList = [],
  visibleLayers = {},
  visibleGroups = {},
  onToggleLayer,
  onToggleAllLayers,
  onToggleGroup,
  onZoomToLayer,
  onZoomToGroup,
  onRefresh,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onDeleteLayer,
  loading = false,
}) {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('layers'); // 'layers' | 'groups'
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedLayerIdsForGroup, setSelectedLayerIdsForGroup] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState({});

  // State untuk Edit Layer Group
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editSelectedLayerIds, setEditSelectedLayerIds] = useState([]);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  // State untuk Alert Confirm Modal (Hapus Layer & Hapus Group)
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    type: null, // 'layer' | 'group'
    id: null,
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const isAllLayersChecked =
    layerList.length > 0 &&
    layerList.every((l) => Boolean(visibleLayers[l.id]));

  const handleToggleSelectForGroup = (id) => {
    setSelectedLayerIdsForGroup((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectForEditGroup = (id) => {
    setEditSelectedLayerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMoveLayerOrder = (isEdit, id, direction, e) => {
    if (e) e.stopPropagation();
    const setter = isEdit ? setEditSelectedLayerIds : setSelectedLayerIdsForGroup;
    setter((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleStartEditGroup = (group) => {
    setEditingGroup(group);
    setEditGroupName(group.title || group.name || '');
    const currentMemberIds = group.layers ? group.layers.map(l => l.id) : [];
    setEditSelectedLayerIds(currentMemberIds);
  };

  const handleSaveEditGroup = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) {
      notify.error("Masukkan nama layer group!");
      return;
    }
    if (editSelectedLayerIds.length === 0) {
      notify.error("Pilih minimal 1 layer anggota!");
      return;
    }

    try {
      setUpdatingGroup(true);
      if (onUpdateGroup) {
        await onUpdateGroup(editingGroup.id, {
          title: editGroupName.trim(),
          layer_ids: editSelectedLayerIds,
        });
      }
      setEditingGroup(null);
    } catch (err) {
      console.error("Gagal mengupdate group:", err);
      notify.error("Gagal mengupdate Layer Group: " + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleSaveNewGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      notify.error("Masukkan nama layer group!");
      return;
    }
    if (selectedLayerIdsForGroup.length === 0) {
      notify.error("Pilih minimal 1 layer untuk dimasukkan ke dalam group!");
      return;
    }

    try {
      setCreatingGroup(true);
      if (onCreateGroup) {
        await onCreateGroup({
          name: newGroupName.trim().toLowerCase().replace(/\s+/g, '_'),
          title: newGroupName.trim(),
          layer_ids: selectedLayerIdsForGroup,
        });
      }
      setNewGroupName('');
      setSelectedLayerIdsForGroup([]);
      setShowCreateGroupModal(false);
    } catch (err) {
      console.error("Gagal membuat group:", err);
      notify.error("Gagal membuat Layer Group: " + (err.response?.data?.detail || err.message));
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmState.id) return;
    try {
      setIsDeleting(true);
      if (deleteConfirmState.type === 'layer' && onDeleteLayer) {
        await onDeleteLayer(deleteConfirmState.id);
      } else if (deleteConfirmState.type === 'group' && onDeleteGroup) {
        await onDeleteGroup(deleteConfirmState.id);
      }
      setDeleteConfirmState({ isOpen: false, type: null, id: null, title: '' });
    } catch (err) {
      console.error("Gagal menghapus:", err);
      notify.error("Gagal menghapus: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleGroupExpand = (groupId) => {
    setExpandedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <section className="px-1 text-xs">
      {/* Header Tabs: Layer vs Layer Group */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === 'layers'
                ? 'bg-white text-teal-700 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Layer ({layerList.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === 'groups'
                ? 'bg-white text-teal-700 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Group ({groupList.length})
          </button>
        </div>

        <div className="flex items-center gap-1">
          {activeTab === 'groups' && (
            <button
              onClick={() => setShowCreateGroupModal(!showCreateGroupModal)}
              title="Create New Layer Group"
              className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors flex items-center gap-0.5 font-medium text-[11px]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Group</span>
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title={t('userLayers.refresh', 'Refresh Data')}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-teal-600 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Form Buat Layer Group Baru */}
      {showCreateGroupModal && (
        <form onSubmit={handleSaveNewGroup} className="mb-3 p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-teal-800 text-[11px] flex items-center gap-1">
              <FolderPlus className="w-3.5 h-3.5 text-teal-600" /> Create Layer Group
            </span>
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Group name (e.g., Flood Analysis 2026)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-teal-500"
            autoFocus
          />

          <div className="flex items-center justify-between text-[10px] text-gray-600 font-medium">
            <span>Select Layers & Ordering:</span>
            <span className="text-[9px] text-teal-600 italic">#1 = Displays on top of the map</span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 bg-white p-1.5 rounded-md border border-gray-100 custom-scrollbar">
            {layerList.length === 0 ? (
              <span className="text-[10px] text-gray-400 italic">No layers available yet.</span>
            ) : (
              layerList.map((l) => {
                const orderIdx = selectedLayerIdsForGroup.indexOf(l.id);
                const isSelected = orderIdx !== -1;
                const orderNum = orderIdx + 1;

                return (
                  <div
                    key={l.id}
                    onClick={() => handleToggleSelectForGroup(l.id)}
                    className={`flex items-center justify-between gap-1.5 cursor-pointer p-1.5 rounded-md transition-all ${
                      isSelected
                        ? 'bg-teal-50/80 border border-teal-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isSelected ? (
                        <span 
                          title={`Order #${orderNum} (Click to deselect)`}
                          className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-teal-200"
                        >
                          {orderNum}
                        </span>
                      ) : (
                        <span 
                          title="Click to select next in order"
                          className="w-5 h-5 rounded-full border border-gray-300 bg-white hover:border-teal-500 flex items-center justify-center shrink-0 text-gray-400 hover:text-teal-600 text-[11px] font-bold"
                        >
                          +
                        </span>
                      )}
                      <span className={`text-[11px] truncate leading-tight ${isSelected ? 'font-semibold text-teal-900' : 'text-gray-700'}`} title={l.layer_name}>
                        {l.layer_name}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={orderIdx === 0}
                          onClick={(e) => handleMoveLayerOrder(false, l.id, 'up', e)}
                          title="Move layer up"
                          className="p-0.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded disabled:opacity-20 disabled:hover:text-gray-400"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={orderIdx === selectedLayerIdsForGroup.length - 1}
                          onClick={(e) => handleMoveLayerOrder(false, l.id, 'down', e)}
                          title="Move layer down"
                          className="p-0.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded disabled:opacity-20 disabled:hover:text-gray-400"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(false)}
              className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingGroup || !newGroupName.trim() || selectedLayerIdsForGroup.length === 0}
              className="px-2.5 py-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {creatingGroup ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save Group
            </button>
          </div>
        </form>
      )}

      {/* Konten Tab 1: Single Layers */}
      {activeTab === 'layers' && (
        <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar space-y-2">
          {loading && layerList.length === 0 ? (
            <div className="py-4 text-center text-gray-400 italic flex flex-col items-center gap-1">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
              <span>Loading analysis layers...</span>
            </div>
          ) : layerList.length === 0 ? (
            <div className="py-3 px-2 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-[11px]">No saved analysis results yet.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Run a spatial analysis to generate a new WMS layer.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center mb-1.5 pb-1 border-b border-gray-100">
                <Checkbox
                  id="user-layer-all"
                  checked={isAllLayersChecked}
                  onCheckedChange={(checked) => onToggleAllLayers && onToggleAllLayers(checked)}
                  className="mr-2"
                />
                <Label htmlFor="user-layer-all" className="text-[11px] font-bold cursor-pointer select-none text-gray-600">
                  Select All Layers
                </Label>
              </div>

              {/* List Layer Items */}
              {layerList.map((layer) => {
                const isChecked = Boolean(visibleLayers[layer.id]);
                const formattedDate = layer.created_at
                  ? new Date(layer.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null;
                const analysisType = layer.metadata?.analysis_type || 'raster';

                return (
                  <div
                    key={layer.id}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      isChecked
                        ? 'bg-teal-50/50 border-teal-200 shadow-xs'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Checkbox
                          id={`user-layer-${layer.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => onToggleLayer(layer, checked)}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`user-layer-${layer.id}`}
                            className="text-[11px] font-medium text-gray-800 cursor-pointer block truncate leading-snug"
                            title={layer.layer_name}
                          >
                            {layer.layer_name}
                          </Label>

                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-500">
                            <span className="px-1.5 py-0.2 bg-teal-100 text-teal-700 rounded font-medium capitalize">
                              {analysisType.replace('_', ' ')}
                            </span>
                            {formattedDate && (
                              <span className="flex items-center gap-0.5 text-gray-400">
                                <Calendar className="w-2.5 h-2.5" />
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Zoom & Delete layer */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {layer.bbox && onZoomToLayer && (
                          <button
                            onClick={() => onZoomToLayer(layer)}
                            title="Zoom to layer"
                            className="p-1 text-gray-400 hover:text-teal-600 hover:bg-white rounded transition-colors"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteLayer && (
                          <button
                            onClick={() => {
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'layer',
                                id: layer.id,
                                title: layer.layer_name || layer.name || 'Analysis Layer',
                              });
                            }}
                            title="Delete Analysis Result"
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Konten Tab 2: Layer Groups */}
      {activeTab === 'groups' && (
        <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar space-y-2">
          {/* Form Edit Layer Group */}
          {editingGroup && (
            <form onSubmit={handleSaveEditGroup} className="mb-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-800 text-[11px] flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Layer Group
                </span>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Group name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-amber-200 rounded-md bg-white focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-between text-[10px] text-amber-900 font-medium">
                <span>Select Layers & Ordering:</span>
                <span className="text-[9px] text-amber-700 italic">#1 = Displays on top of the map</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-white p-1.5 rounded-md border border-amber-200 custom-scrollbar">
                {layerList.map((l) => {
                  const orderIdx = editSelectedLayerIds.indexOf(l.id);
                  const isSelected = orderIdx !== -1;
                  const orderNum = orderIdx + 1;

                  return (
                    <div
                      key={l.id}
                      onClick={() => handleToggleSelectForEditGroup(l.id)}
                      className={`flex items-center justify-between gap-1.5 cursor-pointer p-1.5 rounded-md transition-all ${
                        isSelected
                          ? 'bg-amber-50/80 border border-amber-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isSelected ? (
                          <span 
                            title={`Order #${orderNum} (Click to deselect)`}
                            className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-200"
                          >
                            {orderNum}
                          </span>
                        ) : (
                          <span 
                            title="Click to select next in order"
                            className="w-5 h-5 rounded-full border border-gray-300 bg-white hover:border-amber-500 flex items-center justify-center shrink-0 text-gray-400 hover:text-amber-600 text-[11px] font-bold"
                          >
                            +
                          </span>
                        )}
                        <span className={`text-[11px] truncate leading-tight ${isSelected ? 'font-semibold text-amber-950' : 'text-gray-700'}`} title={l.layer_name}>
                          {l.layer_name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={orderIdx === 0}
                            onClick={(e) => handleMoveLayerOrder(true, l.id, 'up', e)}
                            title="Move layer up"
                            className="p-0.5 text-gray-400 hover:text-amber-600 hover:bg-white rounded disabled:opacity-20 disabled:hover:text-gray-400"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={orderIdx === editSelectedLayerIds.length - 1}
                            onClick={(e) => handleMoveLayerOrder(true, l.id, 'down', e)}
                            title="Move layer down"
                            className="p-0.5 text-gray-400 hover:text-amber-600 hover:bg-white rounded disabled:opacity-20 disabled:hover:text-gray-400"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingGroup}
                  className="px-2.5 py-1 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                  <span>{updatingGroup ? "Saving..." : "Update Group"}</span>
                </button>
              </div>
            </form>
          )}

          {groupList.length === 0 ? (
            <div className="py-3 px-2 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-[11px]">No Layer Groups created yet.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Click the <strong>+ Group</strong> button above to merge multiple layers into a single WMS.
              </p>
            </div>
          ) : (
            groupList.map((group) => {
              const isChecked = Boolean(visibleGroups[group.id]);
              const isExpanded = Boolean(expandedGroupIds[group.id]);

              return (
                <div
                  key={group.id}
                  className={`p-2 rounded-lg border transition-all duration-150 ${
                    isChecked
                      ? 'bg-teal-50/60 border-teal-300 shadow-xs'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        id={`user-group-${group.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => onToggleGroup && onToggleGroup(group, checked)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`user-group-${group.id}`}
                          className="text-[11px] font-semibold text-gray-800 cursor-pointer block truncate leading-snug"
                          title={group.title || group.name}
                        >
                          {group.title || group.name}
                        </Label>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-500">
                          <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-medium">
                            {group.layers?.length || 0} Layers
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(group.id)}
                            className="text-teal-600 hover:underline flex items-center gap-0.5 text-[9px]"
                          >
                            {isExpanded ? (
                              <>Collapse <ChevronDown className="w-2.5 h-2.5" /></>
                            ) : (
                              <>View <ChevronRight className="w-2.5 h-2.5" /></>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {group.bbox && onZoomToGroup && (
                        <button
                          onClick={() => onZoomToGroup(group)}
                          title="Zoom to group"
                          className="p-1 text-gray-400 hover:text-teal-600 hover:bg-white rounded transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      )}
                      {onUpdateGroup && (
                        <button
                          onClick={() => handleStartEditGroup(group)}
                          title="Edit Layer Group"
                          className="p-1 text-gray-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteGroup && (
                        <button
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              type: 'group',
                              id: group.id,
                              title: group.title || group.name || 'Layer Group',
                            });
                          }}
                          title="Delete Layer Group"
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Daftar layer anggota grup ketika accordion dibuka */}
                  {isExpanded && group.layers && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 pl-5 space-y-1">
                      {group.layers.map((l, idx) => (
                        <div key={l.id || idx} className="text-[10px] text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                          <span className="truncate">{l.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Existing Alert Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, type: null, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={deleteConfirmState.type === 'layer' ? "Delete Analysis Result?" : "Delete Layer Group?"}
        message={
          deleteConfirmState.type === 'layer'
            ? `Are you sure you want to delete analysis result "${deleteConfirmState.title}"? The data in GeoServer and database will be deleted.`
            : `Are you sure you want to delete layer group "${deleteConfirmState.title}"?`
        }
      />
    </section>
  );
}
