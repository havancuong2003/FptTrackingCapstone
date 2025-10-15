import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import client from "../../../utils/axiosClient";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Delivery() {
    const [majors, setMajors] = React.useState([]);
    const [selectedMajorId, setSelectedMajorId] = React.useState("");
    const [weeks, setWeeks] = React.useState(16); // default 16 weeks
    const [milestones, setMilestones] = React.useState([]); // from API

    // Modal state
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalWeek, setModalWeek] = React.useState(1);
    const [modalDay, setModalDay] = React.useState("Monday");
    const [deadlineTime, setDeadlineTime] = React.useState("23:59");
    const [selectedMilestone, setSelectedMilestone] = React.useState(null); // selected milestone
    const [modalError, setModalError] = React.useState("");
    const [editingItems, setEditingItems] = React.useState([]); // items in the selected milestone

    // Load majors then milestones
    React.useEffect(() => {
        let mounted = true;
        async function loadMajors() {
            try {
                const res = await client.get("https://160.30.21.113:5000/api/Staff/GetMajors");
                const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                if (!mounted) return;
                setMajors(list);
                if (list.length > 0) setSelectedMajorId(String(list[0].id));
            } catch {
                if (!mounted) return;
                setMajors([]);
            }
        }
        loadMajors();
        return () => {
            mounted = false;
        };
    }, []);

    React.useEffect(() => {
        let mounted = true;
        async function loadMilestones() {
            if (!selectedMajorId) return;
            try {
                const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${selectedMajorId}`;
                const res = await client.get(url);
                const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                // Filter only active milestones
                // const activeMilestones = list.filter(milestone => milestone.isActive === true);
                if (!mounted) return;
                setMilestones(list);
            } catch {
                if (!mounted) return;
                setMilestones([]);
            }
        }
        loadMilestones();
        return () => {
            mounted = false;
        };
    }, [selectedMajorId]);

    const selectedMajor = React.useMemo(() => majors.find((m) => String(m.id) === String(selectedMajorId)) || null, [majors, selectedMajorId]);

    function openCellEditor(weekIndex, dayIndex) {
        setModalWeek(weekIndex + 1);
        setModalDay(DAYS[dayIndex]);
        setDeadlineTime("23:59");
        setSelectedMilestone(null);
        setEditingItems([]);
        setModalError("");
        setIsModalOpen(true);
    }

    function openEditMilestone(milestone) {
        // Extract current deadline info if exists
        if (milestone.deadline) {
            const parts = milestone.deadline.split(" - ");
            if (parts.length >= 3) {
                const weekPart = parts[0]; // "Week X"
                const dayPart = parts[1]; // "Day"
                const timePart = parts[2]; // "HH:MM"
                setModalWeek(parseInt(weekPart.split(" ")[1]));
                setModalDay(dayPart);
                setDeadlineTime(timePart);
            }
        } else {
            setModalWeek(1);
            setModalDay("Monday");
            setDeadlineTime("23:59");
        }
        setSelectedMilestone(milestone);
        setEditingItems(milestone.items ? [...milestone.items] : []);
        setModalError("");
        setIsModalOpen(true);
    }

    function openViewMilestone(milestone) {
        // For viewing milestone with existing deadline - show only its info
        if (milestone.deadline) {
            const parts = milestone.deadline.split(" - ");
            if (parts.length >= 3) {
                const weekPart = parts[0]; // "Week X"
                const dayPart = parts[1]; // "Day"
                const timePart = parts[2]; // "HH:MM"
                setModalWeek(parseInt(weekPart.split(" ")[1]));
                setModalDay(dayPart);
                setDeadlineTime(timePart);
            }
        }
        setSelectedMilestone(milestone);
        setEditingItems(milestone.items ? [...milestone.items] : []);
        setModalError("");
        setIsModalOpen(true);
    }

    function selectMilestone(milestone) {
        setSelectedMilestone(milestone);
        setEditingItems(milestone.items ? [...milestone.items] : []);
    }

    function addItem() {
        setEditingItems(prev => [...prev, { name: "", description: "" }]);
    }

    function removeItem(index) {
        setEditingItems(prev => prev.filter((_, i) => i !== index));
    }

    function updateItem(index, field, value) {
        setEditingItems(prev => prev.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        ));
    }

    async function saveDeadline(e) {
        e.preventDefault();
        if (!selectedMilestone) {
            setModalError("Please select a milestone");
            return;
        }
        if (editingItems.some(item => !item.name.trim())) {
            setModalError("All items must have a name");
            return;
        }
        const deadlineString = `Week ${modalWeek} - ${modalDay} - ${deadlineTime}`;
        try {
            const payload = {
                id: selectedMilestone.id,
                name: selectedMilestone.name,
                description: selectedMilestone.description || "",
                deadline: deadlineString,
                majorId: Number(selectedMajorId),
                items: editingItems.map(item => {
                    const itemData = {
                        name: item.name.trim(),
                        description: item.description.trim()
                    };
                    // Only include ID if it exists (for existing items)
                    if (item.id) {
                        itemData.id = item.id;
                    }
                    return itemData;
                })
            };
            await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
            setIsModalOpen(false);
            // refetch
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${selectedMajorId}`;
            const res = await client.get(url);
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setMilestones(list);
        } catch (err) {
            setModalError(err?.message || "Failed to save deadline");
        }
    }

    async function removeDeadline() {
        if (!selectedMilestone) return;
        try {
            const payload = {
                id: selectedMilestone.id,
                name: selectedMilestone.name,
                description: selectedMilestone.description || "",
                deadline: null,
                majorId: Number(selectedMajorId),
                items: editingItems.map(item => {
                    const itemData = {
                        name: item.name.trim(),
                        description: item.description.trim()
                    };
                    // Only include ID if it exists (for existing items)
                    if (item.id) {
                        itemData.id = item.id;
                    }
                    return itemData;
                })
            };
            await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
            setIsModalOpen(false);
            // refetch
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorId=${selectedMajorId}`;
            const res = await client.get(url);
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setMilestones(list);
        } catch (err) {
            setModalError(err?.message || "Failed to remove deadline");
        }
    }

    // Helpers to render cell content
    function getCellItems(weekIdx, dayIdx) {
        const prefix = `Week ${weekIdx + 1} - ${DAYS[dayIdx]}`;
        return milestones.filter((m) => (m.deadline || "").startsWith(prefix));
    }

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <h2 style={{ margin: 0, flex: 1 }}>Delivery Timeline</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
                    <Select value={selectedMajorId} onChange={(e) => setSelectedMajorId(e.target.value)}>
                        {majors.map((m) => (
                            <option key={m.id} value={m.id}>{m.code}</option>
                        ))}
                    </Select>
                </div>
            </div>
            <p style={{ marginTop: 0, color: "#64748b" }}>Set and track delivery timelines for Capstone milestones.</p>

            {/* Grid */}
            <div style={{ overflow: "auto", border: "2px solid #d1d5db", borderRadius: 8, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0, background: "#fff" }}>
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={{ textAlign: "left", padding: 16, border: "1px solid #d1d5db", width: 120, fontWeight: 600, color: "#374151" }}> </th>
                            {DAYS.map((d) => (
                                <th key={d} style={{ textAlign: "center", padding: 16, border: "1px solid #d1d5db", fontWeight: 600, color: "#374151" }}>{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: weeks }).map((_, w) => (
                            <tr key={w}>
                                <td style={{ padding: 16, border: "1px solid #d1d5db", fontWeight: 600, background: "#f8fafc", color: "#374151" }}>Week {w + 1}</td>
                                {DAYS.map((_, d) => {
                                    const items = getCellItems(w, d);
                                    return (
                                        <td 
                                            key={d} 
                                            style={{ 
                                                padding: 12, 
                                                border: "1px solid #d1d5db", 
                                                position: "relative", 
                                                minWidth: 160,
                                                minHeight: 100,
                                                verticalAlign: "top"
                                            }}
                                            onMouseEnter={(e) => {
                                                const plusIcon = e.currentTarget.querySelector('.plus-icon');
                                                if (plusIcon && items.length === 0) plusIcon.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                const plusIcon = e.currentTarget.querySelector('.plus-icon');
                                                if (plusIcon) plusIcon.style.opacity = '0';
                                            }}
                                        >
                                            <div
                                                className="plus-icon"
                                                onClick={() => openCellEditor(w, d)}
                                                title="Add deadline"
                                                style={{ 
                                                    cursor: "pointer", 
                                                    position: "absolute", 
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    color: "#94a3b8",
                                                    opacity: 0,
                                                    transition: "opacity 0.2s ease",
                                                    fontSize: 32,
                                                    fontWeight: "bold",
                                                    zIndex: 10
                                                }}
                                            >
                                                ＋
                                            </div>
                                            {items.map((it) => (
                                                <div key={it.id} style={{ 
                                                    background: "#e0f2fe", 
                                                    border: "1px solid #0891b2", 
                                                    borderRadius: 6, 
                                                    padding: "8px 10px", 
                                                    marginBottom: 6,
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                                                        <span style={{ fontWeight: 600, fontSize: 13, color: "#0c4a6e" }}>{it.name}</span>
                                                        <span 
                                                            style={{ cursor: "pointer", color: "#64748b", fontSize: 12 }} 
                                                            onClick={() => openViewMilestone(it)} 
                                                            title="Edit"
                                                        >
                                                            ✎
                                                        </span>
                                                    </div>
                                                    <div style={{ color: "#0369a1", fontSize: 11, marginTop: 2 }}>
                                                        📄 {(it.deadline || "").split(" - ")[2] || "23:59"}
                                                    </div>
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary table */}
            <div style={{ maxWidth: 560 }}>
                <h3 style={{ marginTop: 0 }}>Deliverable Milestones:</h3>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead style={{ background: "#f9fafb" }}>
                            <tr>
                                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>No</th>
                                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Milestone</th>
                                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Deadline</th>
                                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {milestones.map((m, idx) => (
                                <tr key={m.id}>
                                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{idx + 1}</td>
                                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{m.name}</td>
                                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{m.deadline || "-"}</td>
                                    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                        <span 
                                            style={{ 
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: m.deadline ? "#059669" : "#dc2626",
                                                background: m.deadline ? "#d1fae5" : "#fee2e2",
                                                padding: "4px 8px",
                                                borderRadius: 12,
                                                border: `1px solid ${m.deadline ? "#10b981" : "#ef4444"}`,
                                                display: "inline-block",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            {m.deadline ? "✓ Delivered" : "✗ Not Delivered"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {milestones.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: 12, textAlign: "center", color: "#64748b" }}>No milestones</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12 }}>
                    <span style={{ color: "#059669", fontWeight: 600 }}>✓ : Delivered</span>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ : Not Delivered</span>
                </div>
            </div>

            {/* Modal for set deadline */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={saveDeadline} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h3 style={{ margin: 0 }}>Delivery Milestone</h3>
                    {modalError && <div style={{ color: "#dc2626" }}>{modalError}</div>}
                    <div>Timeline: <strong>Week {modalWeek} - {modalDay}</strong></div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>Deadline:</span>
                        <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                    </label>

                    {!selectedMilestone || !selectedMilestone.deadline ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>Select Milestone:</span>
                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 150, overflow: "auto" }}>
                            {milestones.filter(m => !m.deadline || m.deadline.length === 0).map((m) => {
                                const isSelected = selectedMilestone?.id === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectMilestone(m)}
                                        style={{
                                            background: isSelected ? "#dbeafe" : "#f1f5f9",
                                            border: `1px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                                            color: "#0f172a",
                                            borderRadius: 12,
                                            padding: "6px 10px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            cursor: "pointer",
                                        }}
                                        title="Select milestone"
                                    >
                                        {m.name}
                                    </button>
                                );
                            })}
                        </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span>Milestone Information:</span>
                            <div style={{ 
                                border: "1px solid #e5e7eb", 
                                borderRadius: 12, 
                                padding: 12, 
                                background: "#fef3c7",
                                borderColor: "#f59e0b"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#92400e" }}>{selectedMilestone.name}</div>
                                        <div style={{ fontSize: 12, color: "#a16207", marginTop: 2 }}>
                                            📅 {selectedMilestone.deadline}
                                        </div>
                                        {selectedMilestone.description && (
                                            <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>
                                                {selectedMilestone.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMilestone && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>Items in "{selectedMilestone.name}":</span>
                                <Button variant="ghost" size="sm" type="button" onClick={addItem}>Add Item</Button>
                            </div>
                            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto", maxHeight: 300 }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead style={{ background: "#f9fafb" }}>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Name</th>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Description</th>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", width: "80px" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editingItems.map((item, idx) => (
                                            <tr key={item.id || idx}>
                                                <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Input 
                                                        value={item.name || ""} 
                                                        onChange={(e) => updateItem(idx, "name", e.target.value)} 
                                                        placeholder="Item name"
                                                        style={{ width: "100%" }}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Input 
                                                        value={item.description || ""} 
                                                        onChange={(e) => updateItem(idx, "description", e.target.value)} 
                                                        placeholder="Description"
                                                        style={{ width: "100%" }}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Button variant="ghost" size="sm" type="button" onClick={() => removeItem(idx)}>Remove</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {editingItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                                                    No items. Click "Add Item" to add items.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {selectedMilestone && selectedMilestone.deadline && (
                            <Button 
                                variant="ghost" 
                                type="button" 
                                onClick={removeDeadline}
                                style={{ color: "#dc2626", borderColor: "#dc2626" }}
                            >
                                Remove Deadline
                            </Button>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={!selectedMilestone}>Save</Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
