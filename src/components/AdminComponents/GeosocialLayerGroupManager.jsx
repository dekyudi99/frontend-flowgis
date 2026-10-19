import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { FolderTree, Plus, Edit2, Trash2, Loader2, X, Search, Eye, EyeOff, ChevronUp, ChevronDown, Layers, ArrowUpDown } from 'lucide-react';
import ConfirmModal from '@/components/popups/ConfirmModal';
import { projectService } from '@/services/projectService';
import { useNotification } from '@/context/NotificationContext';

// Layer geosocial memakai layer_key "workspace:nama_teknis"; GeoServer microservice me-resolve anggota via nama teknis.
const toTechnicalName = (layerKey = '') => (layerKey.includes(':') ? layerKey.split(':')[1] : layerKey);

const toGroupName = (title) =>
  'lg_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

const EMPTY_FORM = { title: '', abstract_text: '', layer_ids: [] };

export default function GeosocialLayerGroupManager({ geosocialList = [], viewingGroupId = null, onViewGroup }) {
  const { notify } = useNotification();
  // notify dibuat ulang tiap render oleh provider; simpan di ref agar fetchGroups stabil.
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [layerSearch, setLayerSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const layerOptions = useMemo(
    () =>
      geosocialList
        .map((item) => ({
          id: toTechnicalName(item.layer_name || item.layer_key || ''),
          label: item.display_name || item.name || item.layer_name,
          type: item.type || 'WMS',
        }))
        .filter((opt) => opt.id),
    [geosocialList]
  );

  const labelById = useMemo(() => Object.fromEntries(layerOptions.map((o) => [o.id, o.label])), [layerOptions]);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await projectService.getUserLayerGroups();
      const list = Array.isArray(response?.data) ? response.data : [];
      setGroups(list);
    } catch (err) {
      notifyRef.current.error(err.response?.data?.message || 'Failed to load layer groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const openCreate = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setLayerSearch('');
    setIsModalOpen(true);
  };

  const openEdit = (group) => {
    setEditingGroup(group);
    setForm({
      title: group.title || group.name || '',
      abstract_text: group.abstract_text || '',
      layer_ids: (group.layer_ids || []).map(String),
    });
    setLayerSearch('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  // Pindahkan urutan layer naik atau turun
  const moveLayer = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= form.layer_ids.length) return;
    const newArr = [...form.layer_ids];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setForm((prev) => ({ ...prev, layer_ids: newArr }));
  };

  // Hapus layer dari susunan anggota grup
  const handleRemoveMemberLayer = (idToRemove) => {
    setForm((prev) => ({
      ...prev,
      layer_ids: prev.layer_ids.filter((id) => id !== idToRemove),
    }));
  };

  // Tambah layer ke susunan anggota grup
  const handleAddMemberLayer = (idToAdd) => {
    if (!idToAdd) return;
    if (!form.layer_ids.includes(idToAdd)) {
      setForm((prev) => ({
        ...prev,
        layer_ids: [...prev.layer_ids, idToAdd],
      }));
    }
  };

  // Ambil informasi nama layer untuk urutan list
  const getLayerInfo = useCallback((id) => {
    const opt = layerOptions.find((o) => o.id === id);
    if (opt) return { id, label: opt.label, type: opt.type };

    if (editingGroup?.layers && Array.isArray(editingGroup.layers)) {
      const gl = editingGroup.layers.find(
        (l) => l.geoserver_name === id || l.layer_id === id || l.id === id || l.layer_name === id
      );
      if (gl) {
        return {
          id,
          label: gl.layer_name || gl.name || id,
          type: gl.layer_type || gl.data_type || 'VECTOR',
        };
      }
    }

    return { id, label: id, type: null };
  }, [layerOptions, editingGroup]);

  // Daftar layer yang belum masuk ke dalam grup
  const availableLayersToAdd = useMemo(() => {
    return layerOptions.filter((opt) => !form.layer_ids.includes(opt.id));
  }, [layerOptions, form.layer_ids]);

  const filteredAvailableLayers = useMemo(() => {
    if (!layerSearch) return availableLayersToAdd;
    const q = layerSearch.toLowerCase();
    return availableLayersToAdd.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.id.toLowerCase().includes(q)
    );
  }, [availableLayersToAdd, layerSearch]);

  const handleAddAllAvailable = () => {
    const newIds = filteredAvailableLayers.map((l) => l.id);
    setForm((prev) => ({
      ...prev,
      layer_ids: [...prev.layer_ids, ...newIds],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      notify.error('Layer group title is required');
      return;
    }
    if (form.layer_ids.length === 0) {
      notify.error('Select at least one member layer to create a Layer Group');
      return;
    }

    setIsSaving(true);
    try {
      if (editingGroup) {
        await projectService.updateUserLayerGroup(editingGroup.id, {
          title,
          abstract_text: form.abstract_text,
          layer_ids: form.layer_ids,
        });
        notify.success(`Layer group "${title}" successfully updated!`);
      } else {
        await projectService.createUserLayerGroup({
          name: toGroupName(title),
          title,
          abstract_text: form.abstract_text,
          layer_ids: form.layer_ids,
        });
        notify.success(`Layer group "${title}" successfully created!`);
      }
      setIsModalOpen(false);
      await fetchGroups();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to save layer group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await projectService.deleteUserLayerGroup(deleteTarget.id);
      notify.success(`Layer group "${deleteTarget.title || deleteTarget.name}" deleted successfully!`);
      if (viewingGroupId === deleteTarget.id && onViewGroup) onViewGroup(null);
      setDeleteTarget(null);
      await fetchGroups();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete layer group');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-white w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-teal-600" /> Geosocial Layer Groups
          </CardTitle>
          <span className="text-xs text-gray-500 font-medium">
            Combine several GeoServer layers into one WMS layer group. Total: {groups.length} groups
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          id="btn-create-layer-group"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Layer Group
        </button>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-xs">Loading layer groups...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">No layer groups have been created yet.</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold">
                <th className="p-3">Group Title &amp; Identifier</th>
                <th className="p-3">Member Layers</th>
                <th className="p-3">Date Created</th>
                <th className="p-3 text-center">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">{group.title || group.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{group.wms_layers_param || group.name}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-sky-50 text-sky-700 border-sky-200">
                      {group.layer_count ?? (group.layer_ids || []).length} layers
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {group.created_at
                      ? new Date(group.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {onViewGroup && (
                        <button
                          type="button"
                          onClick={() => onViewGroup(viewingGroupId === group.id ? null : group)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded cursor-pointer transition-colors"
                          title={viewingGroupId === group.id ? 'Hide from Map' : 'Show on Map'}
                        >
                          {viewingGroupId === group.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(group)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                        title="Edit Layer Group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(group)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                        title="Delete Layer Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>

      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {editingGroup ? 'Edit Layer Group & Urutan' : 'Create New Layer Group'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-normal">
                    Set the title, arrange the layer order, and add a new layer
                  </p>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="lg-title">
                  Layer Group Title
                </label>
                <input
                  id="lg-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Example: Flood Risk Analysis & Contours"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {!editingGroup && form.title.trim() && (
                  <p className="mt-1 text-[10px] text-gray-400 font-mono">GeoServer name: {toGroupName(form.title)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="lg-abstract">
                  Description / Abstract (Optional)
                </label>
                <textarea
                  id="lg-abstract"
                  rows={2}
                  value={form.abstract_text}
                  onChange={(e) => setForm((prev) => ({ ...prev, abstract_text: e.target.value }))}
                  placeholder="A brief description of the layer group..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Daftar Urutan Layer Anggota (Rendering Order) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <span>Member Layers ({form.layer_ids.length})</span>
                    <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-100 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> Rendering Order: Bottom → Top
                    </span>
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/70 max-h-56 overflow-y-auto space-y-1.5">
                  {form.layer_ids.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      No member layer has been selected yet. Add a layer from the list below.
                    </div>
                  ) : (
                    form.layer_ids.map((layerId, idx) => {
                      const info = getLayerInfo(layerId);
                      return (
                        <div
                          key={layerId}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-lg text-xs shadow-2xs hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <span className="font-mono text-slate-400 font-bold w-6 shrink-0 text-center">
                              #{idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-800 truncate" title={info.label}>
                                {info.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono truncate">
                                {layerId}
                              </span>
                            </div>
                            {info.type && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0 ml-1">
                                {info.type}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Tombol Naik */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveLayer(idx, -1)}
                              className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              title="Move Up (Layer rendered lower down)"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            {/* Tombol Turun */}
                            <button
                              type="button"
                              disabled={idx === form.layer_ids.length - 1}
                              onClick={() => moveLayer(idx, 1)}
                              className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              title="Move Down (Layer rendered higher up)"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberLayer(layerId)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors ml-1"
                              title="Remove from Layer Group"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tambah Layer ke Grup */}
              {availableLayersToAdd.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Add Layer to Group ({availableLayersToAdd.length} available)
                    </span>
                    {filteredAvailableLayers.length > 1 && (
                      <button
                        type="button"
                        onClick={handleAddAllAvailable}
                        className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      >
                        Add all ({filteredAvailableLayers.length})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={layerSearch}
                      onChange={(e) => setLayerSearch(e.target.value)}
                      placeholder="Find the layer you want to add..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {filteredAvailableLayers.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center py-2">
                        No layers match the search.
                      </p>
                    ) : (
                      filteredAvailableLayers.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/70 text-xs hover:border-teal-300 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-medium text-slate-800 truncate">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{opt.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddMemberLayer(opt.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 cursor-pointer shrink-0 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-400">
                  All layers present in the catalog have been added to this Layer Group..
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || form.layer_ids.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingGroup ? 'Save Changes' : 'Create Layer Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Layer Group?"
        message={`Are you sure you want to delete "${deleteTarget?.title || deleteTarget?.name || 'this group'}" from GeoServer? Member layers will not be deleted.`}
        confirmText="Yes, Delete Group"
        cancelText="Cancel"
      />
    </Card>
  );
}
