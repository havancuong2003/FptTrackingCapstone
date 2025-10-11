import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import client from "../../../utils/axiosClient";
import Modal from "../../../components/Modal/Modal";

function Milestone() {
    const [majors, setMajors] = React.useState([]);
    const [selectedMajorId, setSelectedMajorId] = React.useState("");
    const [milestones, setMilestones] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [sortBy, setSortBy] = React.useState("name"); // name | createAt
    const [page, setPage] = React.useState(1);
    const pageSize = 10;

    // Edit modal state
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState(null);
    const [editError, setEditError] = React.useState("");

    // Create-many modal state
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [createMajorId, setCreateMajorId] = React.useState("");
    const [createRows, setCreateRows] = React.useState([]); // { name, description }
    const [createError, setCreateError] = React.useState("");

    // Load majors on mount and select the first one
    React.useEffect(() => {
        let mounted = true;
        async function fetchMajors() {
            try {
                const res = await client.get(
                    "https://160.30.21.113:5000/api/Staff/GetMajors"
                );
                const body = res?.data || {};
                const list = Array.isArray(body.data) ? body.data : [];
                if (!mounted) return;
                setMajors(list);
                if (list.length > 0) {
                    setSelectedMajorId(String(list[0].id));
                    setCreateMajorId(String(list[0].id));
                }
            } catch (e) {
                if (!mounted) return;
                setMajors([]);
            }
        }
        fetchMajors();
        return () => {
            mounted = false;
        };
    }, []);

    // Load milestones when selectedMajorId changes
    React.useEffect(() => {
        let mounted = true;
        async function fetchMilestones() {
            if (!selectedMajorId) return;
            try {
                const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${encodeURIComponent(
                    selectedMajorId
                )}`;
                const res = await client.get(url);
                const body = res?.data || {};
                const list = Array.isArray(body.data) ? body.data : [];
                if (!mounted) return;
                setMilestones(list);
                setPage(1);
            } catch (e) {
                if (!mounted) return;
                setMilestones([]);
            }
        }
        fetchMilestones();
        return () => {
            mounted = false;
        };
    }, [selectedMajorId]);

    const filtered = React.useMemo(() => {
        const lower = search.trim().toLowerCase();
        let list = milestones.filter((m) => {
            const searchOk =
                lower === "" ||
                (m.name || "").toLowerCase().includes(lower) ||
                (m.description || "").toLowerCase().includes(lower) ||
                (m.majorName || "").toLowerCase().includes(lower);
            return searchOk;
        });

        list.sort((a, b) => {
            if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
            if (sortBy === "createAt")
                return new Date(a.createAt || 0) - new Date(b.createAt || 0);
            return 0;
        });

        return list;
    }, [milestones, search, sortBy]);

    const selectedMajor = React.useMemo(() => {
        return majors.find((m) => String(m.id) === String(selectedMajorId)) || null;
    }, [majors, selectedMajorId]);

    const paged = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    function openEdit(item) {
        setEditingItem({ ...item, code: selectedMajor?.code || "" });
        setEditError("");
        setIsEditOpen(true);
    }

    function closeEdit() {
        setIsEditOpen(false);
        setEditingItem(null);
        setEditError("");
    }

    async function saveEdit(e) {
        e.preventDefault();
        if (!editingItem) return;
        const name = (editingItem.name || "").trim();
        if (!name) {
            setEditError("Name is required");
            return;
        }
        const dup = milestones.some(
            (m) => m.id !== editingItem.id && (m.name || "").toLowerCase() === name.toLowerCase()
        );
        if (dup) {
            setEditError("Name must be unique");
            return;
        }
        try {
            const body = 
                {
                    id: editingItem.id,
                    name: editingItem.name,
                    description: editingItem.description || "",
                    majorId: Number(selectedMajorId),
                }
            ;
            await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", body);
            closeEdit();
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${encodeURIComponent(
                selectedMajorId
            )}`;
            const res = await client.get(url);
            const bodyRes = res?.data || {};
            setMilestones(Array.isArray(bodyRes.data) ? bodyRes.data : []);
        } catch (err) {
            setEditError(err?.message || "Update failed");
        }
    }

    async function deleteMilestone() {
        if (!editingItem) return;
        try {
            await client.delete(`https://160.30.21.113:5000/api/v1/Staff/milestone/${editingItem.id}`);
            closeEdit();
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${encodeURIComponent(
                selectedMajorId
            )}`;
            const res = await client.get(url);
            const bodyRes = res?.data || {};
            setMilestones(Array.isArray(bodyRes.data) ? bodyRes.data : []);
        } catch (err) {
            setEditError(err?.message || "Delete failed");
        }
    }

    function openCreate() {
        setCreateRows([{ name: "", description: "" }]);
        setCreateError("");
        setIsCreateOpen(true);
    }

    function closeCreate() {
        setIsCreateOpen(false);
        setCreateRows([]);
        setCreateError("");
    }

    function updateCreateRow(index, field, value) {
        setCreateRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    }

    function addCreateRow() {
        setCreateRows((prev) => [...prev, { name: "", description: "" }]);
    }

    function removeCreateRow(index) {
        setCreateRows((prev) => prev.filter((_, i) => i !== index));
    }

    async function saveCreate(e) {
        e.preventDefault();
        const majorIdNum = Number(createMajorId || selectedMajorId);
        if (!majorIdNum) {
            setCreateError("Please select major");
            return;
        }
        const trimmed = createRows.map((r) => ({
            name: (r.name || "").trim(),
            description: (r.description || "").trim(),
        }));
        if (trimmed.some((r) => !r.name)) {
            setCreateError("Name is required in all rows");
            return;
        }
        const names = new Set();
        for (const r of trimmed) {
            const nameKey = r.name.toLowerCase();
            if (names.has(nameKey)) {
                setCreateError("Names must be unique across new rows");
                return;
            }
            names.add(nameKey);
        }
        const existNameSet = new Set(milestones.map((m) => (m.name || "").toLowerCase()));
        if (trimmed.some((r) => existNameSet.has(r.name.toLowerCase()))) {
            setCreateError("Name already exists");
            return;
        }
        try {
            const payload = trimmed.map((r) => ({
                id: 0, // Let the backend auto-generate the ID
                name: r.name,
                description: r.description,
                deadline: null,
                majorId: majorIdNum,
                semesterId: 1,
            }));
            await client.post("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
            closeCreate();
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${encodeURIComponent(
                selectedMajorId
            )}`;
            const res = await client.get(url);
            const bodyRes = res?.data || {};
            setMilestones(Array.isArray(bodyRes.data) ? bodyRes.data : []);
        } catch (err) {
            setCreateError(err?.message || "Create failed");
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 16,
                    background: "#fff",
                    padding: 12,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                }}
            >
                {/* Code select */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 240 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
                    <div style={{ width: 160 }}>
                        <Select
                            value={selectedMajorId}
                            onChange={(e) => setSelectedMajorId(e.target.value)}
                        >
                            {majors.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.code}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Search box with trailing icon inside input */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Input
                        placeholder="Search for Capstone Milestone by Code or Milestone Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", paddingRight: 40 }}
                    />
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            right: 12,
                            color: "#94a3b8",
                            pointerEvents: "none",
                        }}
                    >
                        🔍
                    </span>
                </div>

                {/* Sort by select */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Sort by:</span>
                    <div style={{ width: 160 }}>
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Name</option>
                            <option value="createAt">Created time</option>
                        </Select>
                    </div>
                </div>
            </div>

            <div
                style={{
                    overflow: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                    }}
                >
                    <thead style={{ background: "#f9fafb" }}>
                        <tr>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "80px",

                                }}
                            >
                                No.
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "400px",
                                }}
                            >
                                Milestone Name
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                Description
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "120px",
                                }}
                            >
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map((m, idx) => (
                            <tr key={m.id}>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                        // textAlign: "center",
                                    }}
                                >
                                    {(page - 1) * pageSize + idx + 1}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                    }}
                                >
                                    {m.name}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                        fontSize: "14px",
                                        lineHeight: "1.4",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {m.description || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description</span>}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <Button size="sm" onClick={() => openEdit(m)}>Edit ✎</Button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    style={{
                                        padding: 24,
                                        textAlign: "center",
                                        color: "#64748b",
                                    }}
                                >
                                    No milestones found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <div style={{ color: "#64748b" }}>
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <span>Page {page} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                </div>
            </div>

            {/* Create button at the bottom-right */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 16,
                }}
            >
                <Button variant="secondary" onClick={openCreate}>Create +</Button>
            </div>

            {/* Edit Modal */}
            <Modal open={isEditOpen} onClose={closeEdit}>
                {editingItem && (
                    <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <h3 style={{ margin: 0 }}>Edit Milestone</h3>
                        {editError && <div style={{ color: "#dc2626" }}>{editError}</div>}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>ID</span>
                            <Input value={editingItem.id} disabled />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>Code</span>
                            <Input value={selectedMajor?.code || ""} disabled />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>Name</span>
                            <Input value={editingItem.name || ""} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Enter milestone name" />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>Description</span>
                            <textarea value={editingItem.description || ""} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows={4} style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }} placeholder="Describe milestone" />
                        </label>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <Button 
                                variant="ghost" 
                                type="button" 
                                onClick={deleteMilestone}
                                style={{ color: "#dc2626", borderColor: "#dc2626" }}
                            >
                                Delete
                            </Button>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button variant="ghost" type="button" onClick={closeEdit}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Create-many Modal */}
            <Modal open={isCreateOpen} onClose={closeCreate}>
                <form onSubmit={saveCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h3 style={{ margin: 0 }}>Create Milestone Items</h3>
                    {createError && <div style={{ color: "#dc2626" }}>{createError}</div>}
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>Major</span>
                        <Select value={createMajorId} onChange={(e) => setCreateMajorId(e.target.value)}>
                            {majors.map((m) => (
                                <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                            ))}
                        </Select>
                    </label>
                    <div style={{ overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb" }}>Name</th>
                                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb" }}>Description</th>
                                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {createRows.map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                                            <Input value={row.name} onChange={(e) => updateCreateRow(idx, "name", e.target.value)} placeholder="Milestone name" />
                                        </td>
                                        <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                                            <Input value={row.description} onChange={(e) => updateCreateRow(idx, "description", e.target.value)} placeholder="Description" />
                                        </td>
                                        <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                                            <Button variant="ghost" size="sm" type="button" onClick={() => removeCreateRow(idx)}>Remove</Button>
                                        </td>
                                    </tr>
                                ))}
                                {createRows.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>No rows. Click "Add row".</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Button variant="ghost" type="button" onClick={addCreateRow}>Add row</Button>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button variant="ghost" type="button" onClick={closeCreate}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default Milestone;
