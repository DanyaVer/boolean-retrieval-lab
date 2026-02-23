"use client";

import {
  AlertCircle,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------
export interface SportsTeam {
  id?: string;
  name: string;
  sport_type: string;
  founded_date: string;
  trophies_won: number;
  is_active: boolean;
}

export interface SearchSportsParams {
  namePattern?: string;
  sportType?: string;
  foundedAfter?: string;
  foundedBefore?: string;
  minTrophies?: number | "";
  maxTrophies?: number | "";
  isActive?: boolean | "";
}

export default function Lab3Page() {
  // ---------------------------------------------------------------------------
  // Application State
  // ---------------------------------------------------------------------------
  const [teams, setTeams] = useState<SportsTeam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filter State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState<SearchSportsParams>({
    namePattern: "",
    sportType: "",
    foundedAfter: "",
    foundedBefore: "",
    minTrophies: "",
    maxTrophies: "",
    isActive: "",
  });

  // Modal (CRUD) State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<SportsTeam | null>(null);

  // Form State
  const [formData, setFormData] = useState<SportsTeam>({
    name: "",
    sport_type: "",
    founded_date: "",
    trophies_won: 0,
    is_active: true,
  });

  // ---------------------------------------------------------------------------
  // Data Fetching & Search Execution
  // ---------------------------------------------------------------------------
  const executeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Clean up empty strings and unselected values before sending
      const payload: Partial<SearchSportsParams> = {};
      if (searchParams.namePattern)
        payload.namePattern = searchParams.namePattern;
      if (searchParams.sportType) payload.sportType = searchParams.sportType;
      if (searchParams.foundedAfter)
        payload.foundedAfter = searchParams.foundedAfter;
      if (searchParams.foundedBefore)
        payload.foundedBefore = searchParams.foundedBefore;
      if (searchParams.minTrophies !== "")
        payload.minTrophies = Number(searchParams.minTrophies);
      if (searchParams.maxTrophies !== "")
        payload.maxTrophies = Number(searchParams.maxTrophies);
      if (searchParams.isActive !== "")
        payload.isActive = searchParams.isActive === true;

      const response = await fetch("/api/sports/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error("Failed to execute Elasticsearch query.");
      const data = await response.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load uses the search endpoint with empty parameters (match_all)
  useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearFilters = () => {
    setSearchParams({
      namePattern: "",
      sportType: "",
      foundedAfter: "",
      foundedBefore: "",
      minTrophies: "",
      maxTrophies: "",
      isActive: "",
    });
    // We need to defer the search execution slightly to allow state to update,
    // or pass the empty object directly.
    setTimeout(() => {
      document.getElementById("submit-search-btn")?.click();
    }, 0);
  };

  const handleSearchParamChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------------------------------------------------------------
  // CRUD Handlers (Modal)
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      sport_type: "",
      founded_date: "",
      trophies_won: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (team: SportsTeam) => {
    setEditingTeam(team);
    setFormData({ ...team });
    setIsModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let parsedValue: string | number | boolean = value;
    if (type === "number") parsedValue = parseInt(value, 10) || 0;
    if (type === "checkbox")
      parsedValue = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  // CRUD Operations
  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingTeam && editingTeam.id) {
        // UPDATE Request
        const response = await fetch(`/api/sports/${editingTeam.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error("Failed to update document.");
      } else {
        // CREATE Request
        const response = await fetch("/api/sports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error("Failed to create document.");
      }

      await executeSearch(); // Refresh the list using current active filters
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this document from Elasticsearch?",
      )
    )
      return;
    setIsLoading(true);
    try {
      // DELETE Request
      const response = await fetch(`/api/sports/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete document.");

      // Optimistic UI update
      setTeams((prev) => prev.filter((team) => team.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Sports Teams Database
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Elasticsearch Queries & Filters (Subject Domain: Sports)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200 flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <Filter size={18} /> Filters
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add New Team
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Advanced Search & Filter Panel */}
      {isFilterPanelOpen && (
        <form
          onSubmit={executeSearch}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in slide-in-from-top-4 fade-in duration-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wildcard Name Search */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Team Name{" "}
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2 border border-blue-200">
                  wildcard
                </span>
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  name="namePattern"
                  value={searchParams.namePattern}
                  onChange={handleSearchParamChange}
                  placeholder="e.g. Man* or *City or L?kers (Supports * and ? operators)"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Exact Term Match */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Sport Type{" "}
                <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2 border border-emerald-200">
                  term
                </span>
              </label>
              <select
                name="sportType"
                value={searchParams.sportType}
                onChange={handleSearchParamChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">All Sports</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Baseball">Baseball</option>
                <option value="Hockey">Hockey</option>
                <option value="Esports">Esports</option>
              </select>
            </div>

            {/* Numeric Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Trophies Won{" "}
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded ml-2 border border-purple-200">
                  range
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minTrophies"
                  value={searchParams.minTrophies}
                  onChange={handleSearchParamChange}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  name="maxTrophies"
                  value={searchParams.maxTrophies}
                  onChange={handleSearchParamChange}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Founded Date{" "}
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded ml-2 border border-purple-200">
                  range
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  name="foundedAfter"
                  value={searchParams.foundedAfter}
                  onChange={handleSearchParamChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  title="Founded After (gte)"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  name="foundedBefore"
                  value={searchParams.foundedBefore}
                  onChange={handleSearchParamChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  title="Founded Before (lte)"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-2 transition-colors"
            >
              <X size={16} /> Clear Filters
            </button>
            <button
              id="submit-search-btn"
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Search size={16} />{" "}
              {isLoading ? "Searching..." : "Apply Filters"}
            </button>
          </div>
        </form>
      )}

      {/* Data Table View */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Team Name</th>
              <th className="px-6 py-4">Sport Type</th>
              <th className="px-6 py-4">Founded</th>
              <th className="px-6 py-4 text-center">Trophies</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && teams.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-400"
                >
                  Executing query against Elasticsearch...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="text-slate-300" />
                    <p>No documents found matching your filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {team.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                      {team.sport_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">
                    {team.founded_date}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold">
                      <Trophy size={14} /> {team.trophies_won}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {team.is_active ? (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(team)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Document"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => team.id && handleDelete(team.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Update Modal (Unchanged Core Logic) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-slate-800">
                {editingTeam ? "Update Document" : "Create New Document"}
              </h3>
            </div>

            <form onSubmit={handleCrudSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sport Type
                </label>
                <select
                  name="sport_type"
                  required
                  value={formData.sport_type}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>
                    Select sport...
                  </option>
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Esports">Esports</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Founded Date
                  </label>
                  <input
                    type="date"
                    name="founded_date"
                    required
                    value={formData.founded_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Trophies Won
                  </label>
                  <input
                    type="number"
                    name="trophies_won"
                    min="0"
                    required
                    value={formData.trophies_won}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-slate-700 cursor-pointer"
                >
                  Team is currently active
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading
                    ? "Saving..."
                    : editingTeam
                      ? "Update Document"
                      : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
