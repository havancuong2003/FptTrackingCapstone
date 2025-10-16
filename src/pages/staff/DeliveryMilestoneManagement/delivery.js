import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import client from "../../../utils/axiosClient";
import { formatDate } from "../../../utils/date";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Delivery() {
    const [majors, setMajors] = React.useState([]);
    const [selectedMajorId, setSelectedMajorId] = React.useState("");
    const [weeks, setWeeks] = React.useState(16); // default 16 weeks
    const [milestones, setMilestones] = React.useState([]); // from API

    // Current semester + deliverables for current semester by major
    const [currentSemester, setCurrentSemester] = React.useState(null);
    const [deliverables, setDeliverables] = React.useState([]);

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
                const res = await client.get("https://160.30.21.113:5000/api/v1/Staff/getAllCodeCourse");
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

    // Load current semester
    React.useEffect(() => {
        let mounted = true;
        async function loadCurrentSemester() {
            try {
                const res = await client.get("https://160.30.21.113:5000/api/v1/Staff/semester/getSemesterByNow");
                const sem = res?.data?.data || null;
                if (!mounted) return;
                setCurrentSemester(sem);
            } catch {
                if (!mounted) return;
                setCurrentSemester(null);
            }
        }
        loadCurrentSemester();
        return () => {
            mounted = false;
        };
    }, []);

    React.useEffect(() => {
        let mounted = true;
        async function loadMilestones() {
            if (!selectedMajorId) return;
            try {
                const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${selectedMajorId}`;
                const res = await client.get(url);
                const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                // Sort milestones: those without deadline first, then by createAt
                const sortedList = list.sort((a, b) => {
                    // Milestones without deadline go first
                    if (!a.deadline && b.deadline) return -1;
                    if (a.deadline && !b.deadline) return 1;
                    // Then sort by createAt
                    if (a.createAt && b.createAt) {
                        return new Date(a.createAt) - new Date(b.createAt);
                    }
                    return 0;
                });
                if (!mounted) return;
                setMilestones(sortedList);
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

    // Load deliverables for current semester + selected major
    React.useEffect(() => {
        let mounted = true;
        async function loadDeliverables() {
            if (!selectedMajorId || !currentSemester?.id) return;
            try {
                const url = `https://160.30.21.113:5000/api/Deliverable/v1/Staff/deliverables?majorCateId=${selectedMajorId}&semesterId=${currentSemester.id}`;
                const res = await client.get(url);
                const list = Array.isArray(res?.data) ? res.data : [];
                if (!mounted) return;
                setDeliverables(list);
            } catch {
                if (!mounted) return;
                setDeliverables([]);
            }
        }
        loadDeliverables();
        return () => {
            mounted = false;
        };
    }, [selectedMajorId, currentSemester?.id]);

    const selectedMajor = React.useMemo(() => majors.find((m) => String(m.id) === String(selectedMajorId)) || null, [majors, selectedMajorId]);

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
            setModalError("No milestone selected");
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
            console.log(payload);
            await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
            setIsModalOpen(false);
            // refetch
            const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${selectedMajorId}`;
            const res = await client.get(url);
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            // Sort milestones: those without deadline first, then by createAt
            const sortedList = list.sort((a, b) => {
                // Milestones without deadline go first
                if (!a.deadline && b.deadline) return -1;
                if (a.deadline && !b.deadline) return 1;
                // Then sort by createAt
                if (a.createAt && b.createAt) {
                    return new Date(a.createAt) - new Date(b.createAt);
                }
                return 0;
            });
            setMilestones(sortedList);
            // also refresh deliverables of current semester
            if (currentSemester?.id) {
                const deliverUrl = `https://160.30.21.113:5000/api/Deliverable/v1/Staff/deliverables?majorCateId=${selectedMajorId}&semesterId=${currentSemester.id}`;
                const deliverRes = await client.get(deliverUrl);
                const deliverList = Array.isArray(deliverRes?.data) ? deliverRes.data : [];
                setDeliverables(deliverList);
            }
            
        } catch (err) {
            setModalError(err?.message || "Failed to save deadline");
        }
    }

    // async function removeDeadline() {
    //     if (!selectedMilestone) return;
    //     try {
    //         const payload = {
    //             id: selectedMilestone.id,
    //             name: selectedMilestone.name,
    //             description: selectedMilestone.description || "",
    //             deadline: null,
    //             majorId: Number(selectedMajorId),
    //             items: editingItems.map(item => {
    //                 const itemData = {
    //                     name: item.name.trim(),
    //                     description: item.description.trim()
    //                 };
    //                 // Only include ID if it exists (for existing items)
    //                 if (item.id) {
    //                     itemData.id = item.id;
    //                 }
    //                 return itemData;
    //             })
    //         };
    //         await client.put("https://160.30.21.113:5000/api/v1/Staff/milestones", payload);
    //         setIsModalOpen(false);
    //         // refetch
    //         const url = `https://160.30.21.113:5000/api/v1/Staff/milestones?majorCateId=${selectedMajorId}`;
    //         const res = await client.get(url);
    //         const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    //         // Sort milestones: those without deadline first, then by createAt
    //         const sortedList = list.sort((a, b) => {
    //             // Milestones without deadline go first
    //             if (!a.deadline && b.deadline) return -1;
    //             if (a.deadline && !b.deadline) return 1;
    //             // Then sort by createAt
    //             if (a.createAt && b.createAt) {
    //                 return new Date(a.createAt) - new Date(b.createAt);
    //             }
    //             return 0;
    //         });
    //         if (!mounted) return;
    //         setMilestones(sortedList);
    //     } catch (err) {
    //         setModalError(err?.message || "Failed to remove deadline");
    //     }
    // }

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <h2 style={{ margin: 0, flex: 1 }}>Delivery Milestones</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
                    <Select value={selectedMajorId} onChange={(e) => setSelectedMajorId(e.target.value)}>
                        {majors.map((m) => (
                            <option key={m.id} value={m.id}>{m.code}</option>
                        ))}
                    </Select>
                </div>
            </div>
            <p style={{ marginTop: 0, color: "#64748b" }}>Manage and track delivery timelines for Capstone milestones.</p>

            {/* Milestone List */}
            <div style={{ border: "1px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: 10, overflow: "hidden", marginBottom: 24, boxShadow: "0 2px 10px rgba(59,130,246,0.08)" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                    <thead style={{ background: "#eff6ff" }}>
                        <tr>
                            <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Milestone</th>
                            <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Deadline</th>
                            <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Items</th>
                            <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13, width: "120px" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map((milestone, idx) => (
                            <tr 
                                key={milestone.id} 
                                style={{ 
                                    background: !milestone.deadline ? "#fef3c7" : "#fff",
                                    borderBottom: "1px solid #f1f5f9"
                                }}
                            >
                                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                    <div>
                                        <div style={{ 
                                            fontWeight: 600, 
                                            color: !milestone.deadline ? "#92400e" : "#374151",
                                            fontSize: 14,
                                            lineHeight: 1.3
                                        }}>
                                            {milestone.name}
                                        </div>
                                        {milestone.description && (
                                            <div style={{ 
                                                fontSize: 11, 
                                                color: !milestone.deadline ? "#a16207" : "#64748b", 
                                                marginTop: 2,
                                                lineHeight: 1.3
                                            }}>
                                                {milestone.description}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                    {milestone.deadline ? (
                                        <div style={{ color: "#059669", fontWeight: 600, fontSize: 12 }}>
                                            📅 {milestone.deadline}
                                        </div>
                                    ) : (
                                        <span style={{ 
                                            color: "#dc2626", 
                                            fontWeight: 600,
                                            background: "#fee2e2",
                                            padding: "2px 6px",
                                            borderRadius: 8,
                                            fontSize: 11
                                        }}>
                                            No deadline set
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                    <span style={{ 
                                        fontWeight: 600, 
                                        color: "#374151",
                                        background: "#f1f5f9",
                                        padding: "2px 6px",
                                        borderRadius: 8,
                                        fontSize: 11
                                    }}>
                                        {milestone.items ? milestone.items.length : 0} items
                                    </span>
                                </td>
                                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={() => openEditMilestone(milestone)}
                                        style={{ fontSize: 11, padding: "4px 8px" }}
                                    >
                                        {milestone.deadline ? "Edit" : "Set"}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {milestones.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                                    No milestones found for selected major
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* Modal for set deadline */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={saveDeadline} style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 16,
                    width: "800px",
                    maxWidth: "95vw"
                }}>
                    <h3 style={{ margin: 0 }}>
                        {selectedMilestone && selectedMilestone.deadline ? "Edit Milestone Deadline" : "Set Milestone Deadline"}
                    </h3>
                    {modalError && <div style={{ color: "#dc2626" }}>{modalError}</div>}
                    
                    {/* Milestone Information */}
                    {selectedMilestone && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>Milestone Information:</span>
                            <div style={{ 
                                border: "1px solid #e5e7eb", 
                                borderRadius: 12, 
                                padding: 16, 
                                background: selectedMilestone.deadline ? "#f0f9ff" : "#fef3c7",
                                borderColor: selectedMilestone.deadline ? "#0ea5e9" : "#f59e0b"
                            }}>
                                <div>
                                    <div style={{ 
                                        fontWeight: 600, 
                                        color: selectedMilestone.deadline ? "#0c4a6e" : "#92400e",
                                        fontSize: 14,
                                        marginBottom: 4
                                    }}>
                                        {selectedMilestone.name}
                                    </div>
                                    {selectedMilestone.deadline && (
                                        <div style={{ fontSize: 12, color: "#0369a1", marginBottom: 4 }}>
                                            📅 {selectedMilestone.deadline}
                                        </div>
                                    )}
                                    {selectedMilestone.description && (
                                        <div style={{ 
                                            fontSize: 12, 
                                            color: selectedMilestone.deadline ? "#0369a1" : "#a16207", 
                                            lineHeight: 1.4
                                        }}>
                                            {selectedMilestone.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline Settings */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <span style={{ fontWeight: 600 }}>Set Deadline:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Week</label>
                                <Select value={modalWeek} onChange={(e) => setModalWeek(Number(e.target.value))}>
                                    {Array.from({ length: weeks }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                                    ))}
                                </Select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Day</label>
                                <Select value={modalDay} onChange={(e) => setModalDay(e.target.value)}>
                                    {DAYS.map((day) => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </Select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Time</label>
                                <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {selectedMilestone && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Items in "{selectedMilestone.name}":</span>
                                <Button variant="ghost" size="sm" type="button" onClick={addItem}>Add Item</Button>
                            </div>
                            <div style={{ 
                                border: "1px solid #e5e7eb", 
                                borderRadius: 8
                            }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead style={{ background: "#f9fafb" }}>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", fontSize: 12, width: "25%" }}>Name</th>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", fontSize: 12, width: "60%" }}>Description</th>
                                            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", width: "15%", fontSize: 12 }}>Action</th>
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
                                                        style={{ width: "100%", fontSize: 12 }}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                    <textarea 
                                                        value={item.description || ""} 
                                                        onChange={(e) => updateItem(idx, "description", e.target.value)} 
                                                        placeholder="Description"
                                                        style={{ 
                                                            width: "100%", 
                                                            fontSize: 12,
                                                            padding: "8px",
                                                            border: "1px solid #d1d5db",
                                                            borderRadius: "4px",
                                                            resize: "vertical",
                                                            minHeight: "32px",
                                                            fontFamily: "inherit"
                                                        }}
                                                        rows={1}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Button variant="ghost" size="sm" type="button" onClick={() => removeItem(idx)} style={{ fontSize: 11 }}>Remove</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {editingItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: 12 }}>
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
                        {/* {selectedMilestone && selectedMilestone.deadline && (
                            <Button 
                                variant="ghost" 
                                type="button" 
                                onClick={removeDeadline}
                                style={{ color: "#dc2626", borderColor: "#dc2626" }}
                            >
                                Remove Deadline
                            </Button>
                        )} */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={!selectedMilestone}>
                                {selectedMilestone && selectedMilestone.deadline ? "Update" : "Set Deadline"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
            {/* Current semester info + Deliverables table */}
            <div style={{ marginTop: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Deliverable deadlines in current semester</h3>
                </div>
                {currentSemester ? (
                    <div style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: 12,
                        background: "#f0fdf4",
                        marginBottom: 12
                    }}>
                        <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 600 }}>Semester:</span> {currentSemester.name} —
                            <span style={{ marginLeft: 6, fontWeight: 600 }}>From</span> {formatDate(currentSemester.startAt, 'YYYY-MM-DD')} 
                            <span style={{ marginLeft: 6, fontWeight: 600 }}>to</span> {formatDate(currentSemester.endAt, 'YYYY-MM-DD')}
                        </div>
                    </div>
                ) : (
                    <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>No current semester found.</div>
                )}

                <div style={{ border: "1px solid #bbf7d0", borderTop: "4px solid #10b981", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(16,185,129,0.08)" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                        <thead style={{ background: "#ecfdf5" }}>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Milestone</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Deadline (endAt)</th>
                                <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Items</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 }}>Item names</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliverables.map((d) => (
                                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                                        {d.description && (
                                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.description}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                        {d.endAt ? (
                                            <div style={{ color: "#059669", fontWeight: 600, fontSize: 12 }}>📅 {formatDate(d.endAt)}</div>
                                        ) : (
                                            <span style={{ color: "#dc2626", fontWeight: 600, background: "#fee2e2", padding: "2px 6px", borderRadius: 8, fontSize: 11 }}>No deadline</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                                        <span style={{ fontWeight: 600, color: "#374151", background: "#f1f5f9", padding: "2px 6px", borderRadius: 8, fontSize: 11 }}>
                                            {Array.isArray(d.deliveryItems) ? d.deliveryItems.length : 0} items
                                        </span>
                                    </td>
                                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                        {Array.isArray(d.deliveryItems) && d.deliveryItems.length > 0 ? (
                                            <div style={{ fontSize: 12 }}>
                                                {d.deliveryItems.map((it) => it.name).join(', ')}
                                            </div>
                                        ) : (
                                            <span style={{ color: "#64748b", fontSize: 12 }}>No items</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {deliverables.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                                        No deliverables for selected major in this semester
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
