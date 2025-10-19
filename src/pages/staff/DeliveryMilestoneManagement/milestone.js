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
    const [sortBy, setSortBy] = React.useState("createAt"); // name | createAt
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
                    "https://160.30.21.113:5000/api/v1/Staff/getAllCodeCourse"
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
                const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${encodeURIComponent(
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
                return new Date(b.createAt || 0) - new Date(a.createAt || 0); // Descending order (newest first)
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
            // Find the original milestone to preserve items and deadline
            const originalMilestone = milestones.find(m => m.id === editingItem.id);
            const body = {
                id: editingItem.id,
                name: editingItem.name || "",
                description: editingItem.description || "",
                majorCateId: Number(selectedMajorId),
                // Preserve existing items and deadline
                items: originalMilestone?.items || [],
                deadline: originalMilestone?.deadline || null
            };
            await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", body);
            closeEdit();
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${encodeURIComponent(
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
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${encodeURIComponent(
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
                name: r.name,
                description: r.description,
                majorCateId: selectedMajorId,
            }));
            await client.post("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
            closeCreate();
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${encodeURIComponent(
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
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "center",
                    gap: 20,
                    marginBottom: 20,
                    background: "#fff",
                    padding: "16px 20px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                }}
            >
                {/* Major select with name display */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 320 }}>
                    <span style={{ fontWeight: 600 }}>Major:</span>
                    <div style={{ width: 200 }}>
                        <select
                            value={selectedMajorId}
                            onChange={(e) => setSelectedMajorId(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                outline: "none",
                                width: "100%"
                            }}
                        >
                            {majors.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedMajor && (
                        <div style={{ 
                            fontSize: "14px", 
                            color: "#64748b", 
                            fontStyle: "italic",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                            Name: {selectedMajor.name}
                        </div>
                    )}
                </div>

                {/* Search box with trailing icon inside input */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Input
                        placeholder="Search for Capstone Milestone by Name or Description..."
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
            </div>

            <div
                style={{
                    overflow: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                    }}
                >
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "60px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                }}
                            >
                                #
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "300px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                }}
                            >
                                Milestone Name
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #e5e7eb",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
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
                            <tr key={m.id} style={{ 
                                transition: "background-color 0.2s ease",
                                cursor: "pointer"
                            }}
                                onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#f8fafc"}
                                onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = "transparent"}
                            >
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        borderBottom: "1px solid #f1f5f9",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#64748b"
                                    }}
                                >
                                    {(page - 1) * pageSize + idx + 1}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        borderBottom: "1px solid #f1f5f9",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        lineHeight: "1.4"
                                    }}
                                >
                                    {m.name}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        borderBottom: "1px solid #f1f5f9",
                                        fontSize: "14px",
                                        lineHeight: "1.5",
                                        wordBreak: "break-word",
                                        color: "#4b5563"
                                    }}
                                >
                                    {m.description || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No description</span>}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        borderBottom: "1px solid #f1f5f9",
                                        textAlign: "center"
                                    }}
                                >
                                    <Button 
                                        size="sm" 
                                        onClick={() => openEdit(m)}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        padding: "40px 20px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "14px"
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
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginTop: 20,
                padding: "16px 20px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                fontSize: "14px"
            }}>
                <div style={{ color: "#64748b", fontWeight: "500" }}>
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} milestones
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ 
                            padding: "6px 12px",
                            fontSize: "13px",
                            fontWeight: "500"
                        }}
                    >
                        Previous
                    </Button>
                    <span style={{ 
                        color: "#374151", 
                        fontWeight: "500",
                        padding: "0 8px"
                    }}>
                        Page {page} of {totalPages}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{ 
                            padding: "6px 12px",
                            fontSize: "13px",
                            fontWeight: "500"
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Create button at the bottom-right */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 20,
                }}
            >
                <Button 
                    variant="secondary" 
                    onClick={openCreate}
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "600",
                        borderRadius: "8px"
                    }}
                >
                    + Create Milestone
                </Button>
            </div>

            {/* Edit Modal */}
            <Modal open={isEditOpen} onClose={closeEdit} showCloseButton={false}>
                {editingItem && (
                    <div style={{ width: "600px", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
                        <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
                            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "8px" }}>
                                <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                                    Edit Milestone
                                </h3>
                                <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                                    Update milestone information and details
                                </p>
                            </div>
                            {editError && (
                                <div style={{ 
                                    color: "#dc2626", 
                                    backgroundColor: "#fef2f2", 
                                    border: "1px solid #fecaca", 
                                    padding: "12px", 
                                    borderRadius: "6px",
                                    fontSize: "14px"
                                }}>
                                    {editError}
                                </div>
                            )}
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <label style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>Milestone ID</label>
                                    <Input 
                                        value={editingItem.id} 
                                        disabled 
                                        style={{ 
                                            backgroundColor: "#f8fafc", 
                                            color: "#64748b",
                                            border: "1px solid #e2e8f0",
                                            fontWeight: "500"
                                        }} 
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <label style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>Major Code</label>
                                    <Input 
                                        value={selectedMajor?.code || ""} 
                                        disabled 
                                        style={{ 
                                            backgroundColor: "#f8fafc", 
                                            color: "#64748b",
                                            border: "1px solid #e2e8f0",
                                            fontWeight: "500"
                                        }} 
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>
                                    Milestone Name <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <Input 
                                    value={editingItem.name || ""} 
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} 
                                    placeholder="Enter milestone name" 
                                    style={{ 
                                        fontSize: "14px",
                                        padding: "12px 16px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "8px"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>Description</label>
                                <textarea 
                                    value={editingItem.description || ""} 
                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} 
                                    rows={6} 
                                    style={{ 
                                        padding: "12px 16px", 
                                        border: "1px solid #d1d5db", 
                                        borderRadius: "8px", 
                                        fontSize: "14px",
                                        lineHeight: "1.6",
                                        resize: "vertical",
                                        minHeight: "140px",
                                        fontFamily: "inherit",
                                        outline: "none",
                                        transition: "border-color 0.2s ease"
                                    }} 
                                    placeholder="Describe the milestone details, requirements, and objectives..." 
                                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                    onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                                />
                            </div>

                            <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginTop: 20,
                                paddingTop: 20,
                                borderTop: "2px solid #f1f5f9"
                            }}>
                                <Button 
                                    variant="ghost" 
                                    type="button" 
                                    onClick={deleteMilestone}
                                    style={{ 
                                        color: "#dc2626", 
                                        borderColor: "#dc2626",
                                        padding: "10px 20px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        fontSize: "14px"
                                    }}
                                >
                                    Delete Milestone
                                </Button>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <Button 
                                        variant="ghost" 
                                        type="button" 
                                        onClick={closeEdit}
                                        style={{
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        style={{
                                            padding: "10px 24px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            backgroundColor: "#3b82f6",
                                            border: "none",
                                            color: "white"
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </form>
                        </div>
                )}
            </Modal>

            {/* Create-many Modal */}
            <Modal open={isCreateOpen} onClose={closeCreate} showCloseButton={false}>
                <div style={{ width: "900px", maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" }}>
                    <form onSubmit={saveCreate} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "8px" }}>
                            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                                Create Milestone
                            </h3>
                            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                                Add new milestone  to the selected major
                            </p>
                        </div>
                        {createError && (
                            <div style={{ 
                                color: "#dc2626", 
                                backgroundColor: "#fef2f2", 
                                border: "1px solid #fecaca", 
                                padding: "12px", 
                                borderRadius: "6px",
                                fontSize: "14px"
                            }}>
                                {createError}
                            </div>
                        )}
                        
                        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <span style={{ fontWeight: "500", color: "#374151" }}>Major *</span>
                            <select 
                                value={createMajorId} 
                                onChange={(e) => setCreateMajorId(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    outline: "none",
                                    width: "100%"
                                }}
                            >
                                {majors.map((m) => (
                                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                                ))}
                            </select>
                        </label>

                        <div style={{ 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px", 
                            overflow: "hidden",
                            backgroundColor: "#fff",
                            maxHeight: "500px"
                        }}>
                            <div style={{ 
                                backgroundColor: "#f9fafb", 
                                padding: "12px 16px", 
                                borderBottom: "1px solid #e5e7eb",
                                fontWeight: "500",
                                color: "#374151"
                            }}>
                                Milestones ({createRows.length})
                            </div>
                            
                            <div style={{ overflow: "auto", maxHeight: "420px" }}>
                                {createRows.length === 0 ? (
                                    <div style={{ 
                                        padding: "40px 16px", 
                                        textAlign: "center", 
                                        color: "#64748b",
                                        fontSize: "14px"
                                    }}>
                                        No milestone added yet. Click "Add Milestone" to get started.
                                    </div>
                                ) : (
                                    <div style={{ padding: "12px" }}>
                                        <table style={{ 
                                            width: "100%", 
                                            borderCollapse: "separate", 
                                            borderSpacing: 0,
                                            fontSize: "14px"
                                        }}>
                                            <thead style={{ background: "#f8fafc" }}>
                                                <tr>
                                                    <th style={{ 
                                                        textAlign: "left", 
                                                        padding: "8px 12px", 
                                                        borderBottom: "1px solid #e5e7eb",
                                                        width: "50px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#64748b"
                                                    }}>
                                                        #
                                                    </th>
                                                    <th style={{ 
                                                        textAlign: "left", 
                                                        padding: "8px 12px", 
                                                        borderBottom: "1px solid #e5e7eb",
                                                        width: "250px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#64748b"
                                                    }}>
                                                        Name *
                                                    </th>
                                                    <th style={{ 
                                                        textAlign: "left", 
                                                        padding: "8px 12px", 
                                                        borderBottom: "1px solid #e5e7eb",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#64748b"
                                                    }}>
                                                        Description
                                                    </th>
                                                    <th style={{ 
                                                        textAlign: "center", 
                                                        padding: "8px 12px", 
                                                        borderBottom: "1px solid #e5e7eb",
                                                        width: "80px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#64748b"
                                                    }}>
                                                        Action
                                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {createRows.map((row, idx) => (
                                    <tr key={idx}>
                                                        <td style={{ 
                                                            padding: "8px 12px", 
                                                            borderBottom: "1px solid #f1f5f9",
                                                            textAlign: "center",
                                                            fontWeight: "500",
                                                            color: "#64748b"
                                                        }}>
                                                            {idx + 1}
                                                        </td>
                                                        <td style={{ 
                                                            padding: "8px 12px", 
                                                            borderBottom: "1px solid #f1f5f9"
                                                        }}>
                                                            <Input 
                                                                value={row.name} 
                                                                onChange={(e) => updateCreateRow(idx, "name", e.target.value)} 
                                                                placeholder="Enter milestone name..." 
                                                                style={{ 
                                                                    fontSize: "14px", 
                                                                    padding: "8px 12px",
                                                                    border: "1px solid #d1d5db",
                                                                    width: "100%"
                                                                }}
                                                            />
                                        </td>
                                                        <td style={{ 
                                                            padding: "8px 12px", 
                                                            borderBottom: "1px solid #f1f5f9"
                                                        }}>
                                                            <textarea 
                                                                value={row.description} 
                                                                onChange={(e) => updateCreateRow(idx, "description", e.target.value)} 
                                                                rows={3}
                                                                style={{ 
                                                                    width: "100%",
                                                                    padding: "8px 12px", 
                                                                    border: "1px solid #d1d5db", 
                                                                    borderRadius: "4px", 
                                                                    fontSize: "14px",
                                                                    lineHeight: "1.5",
                                                                    resize: "vertical",
                                                                    minHeight: "70px",
                                                                    maxHeight: "120px",
                                                                    fontFamily: "inherit"
                                                                }} 
                                                                placeholder="Enter milestone description..." 
                                                            />
                                        </td>
                                                        <td style={{ 
                                                            padding: "8px 12px", 
                                                            borderBottom: "1px solid #f1f5f9",
                                                            textAlign: "center"
                                                        }}>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                type="button" 
                                                                onClick={() => removeCreateRow(idx)}
                                                                style={{ 
                                                                    color: "#dc2626",
                                                                    padding: "4px 8px",
                                                                    fontSize: "12px"
                                                                }}
                                                            >
                                                                Remove
                                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            paddingTop: "16px",
                            borderTop: "1px solid #e5e7eb"
                        }}>
                            <Button variant="ghost" type="button" onClick={addCreateRow}>
                                + Add Milestone
                            </Button>
                            <div style={{ display: "flex", gap: 12 }}>
                                <Button variant="ghost" type="button" onClick={closeCreate}>Cancel</Button>
                                <Button type="submit" disabled={createRows.length === 0}>
                                    Create {createRows.length} Milestone{createRows.length !== 1 ? 's' : ''}
                                </Button>
                        </div>
                    </div>
                </form>
                </div>
            </Modal>
        </div>
    );
}

export default Milestone;
