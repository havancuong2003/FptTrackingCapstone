import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import DataTable from "../../../components/DataTable/DataTable";
import Modal from "../../../components/Modal/Modal";
import { getAllCodeCourses } from "../../../api/staff";
import { getCurrentSemester } from "../../../api/staff/semester";
import { getMilestonesByMajor, getDeliverablesByMajorAndSemester, updateMilestone } from "../../../api/staff/milestones";
import { formatDate } from "../../../utils/date";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper function to compare deadlines
function compareDeadlines(deadlineA, deadlineB) {
    if (!deadlineA && !deadlineB) return 0;
    if (!deadlineA) return 1;
    if (!deadlineB) return -1;
    
    // Parse "Week X - Day - HH:MM"
    const partsA = deadlineA.split(" - ");
    const partsB = deadlineB.split(" - ");
    
    if (partsA.length < 3 || partsB.length < 3) {
        return deadlineA.localeCompare(deadlineB);
    }
    
    // Compare week number
    const weekA = parseInt(partsA[0].replace("Week ", "")) || 0;
    const weekB = parseInt(partsB[0].replace("Week ", "")) || 0;
    if (weekA !== weekB) return weekA - weekB;
    
    // Compare day
    const dayA = DAYS.indexOf(partsA[1]);
    const dayB = DAYS.indexOf(partsB[1]);
    if (dayA !== dayB) return dayA - dayB;
    
    // Compare time
    return (partsA[2] || "").localeCompare(partsB[2] || "");
}

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
                const res = await getAllCodeCourses();
                const list = Array.isArray(res?.data) ? res.data : [];
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
                const res = await getCurrentSemester();
                const sem = res?.data || null;
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
                const res = await getMilestonesByMajor(selectedMajorId);
                const list = Array.isArray(res?.data) ? res.data : [];
                // Sort milestones: those with deadline first (by deadline), then those without deadline (by createAt)
                const sortedList = list.sort((a, b) => {
                    // Milestones with deadline go first
                    if (a.deadline && !b.deadline) return -1;
                    if (!a.deadline && b.deadline) return 1;
                    // Both have deadline: sort by deadline (ascending - earlier deadline first)
                    if (a.deadline && b.deadline) {
                        return compareDeadlines(a.deadline, b.deadline);
                    }
                    // Both don't have deadline: sort by createAt (ascending - older first)
                    if (!a.deadline && !b.deadline) {
                        if (a.createAt && b.createAt) {
                            return new Date(a.createAt) - new Date(b.createAt);
                        }
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
                const res = await getDeliverablesByMajorAndSemester(selectedMajorId, currentSemester.id);
                const list = Array.isArray(res) ? res : [];
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

    // Define columns for milestones DataTable
    const milestoneColumns = [
        {
            key: 'index',
            title: '#',
            render: (milestone, index) => (
                <span style={{ 
                    fontWeight: 600, 
                    color: "#64748b",
                    fontSize: 14
                }}>
                    {index + 1}
                </span>
            ),
            headerStyle: { width: '50px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        },
        {
            key: 'name',
            title: 'Milestone',
            render: (milestone) => (
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
                            fontSize: 12, 
                            color: !milestone.deadline ? "#a16207" : "#64748b", 
                            marginTop: 2,
                            lineHeight: 1.3
                        }}>
                            {milestone.description}
                        </div>
                    )}
                </div>
            ),
            headerStyle: { width: '300px' }
        },
        {
            key: 'deadline',
            title: 'Deadline',
            render: (milestone) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    {milestone.deadline ? (
                        <div style={{ color: "#059669", fontWeight: 600, fontSize: 14 }}>
                            {milestone.deadline}
                        </div>
                    ) : (
                        <span style={{ 
                            color: "#dc2626", 
                            fontWeight: 600,
                            background: "#fee2e2",
                            padding: "2px 6px",
                            borderRadius: 8,
                            fontSize: 14,
                        }}>
                            No deadline set
                        </span>
                    )}
                </div>
            ),
            headerStyle: { width: '120px' , textAlign: 'center'}
        },
        {
            key: 'items',
            title: 'Items',
            render: (milestone) => (
                <span style={{ 
                    fontWeight: 600, 
                    color: "#374151",
                    background: "#f1f5f9",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 14
                }}>
                    {milestone.items ? milestone.items.length : 0} items
                </span>
            ),
            headerStyle: { width: '75px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        },
        {
            key: 'actions',
            title: 'Action',
            render: (milestone) => (
                <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => openEditMilestone(milestone)}
                    style={{ fontSize: 14, padding: "6px 12px", fontWeight: "600" }}
                >
                    {milestone.deadline ? "Edit" : "Set"}
                </Button>
            ),
            headerStyle: { width: '75px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        }
    ];

    // Define columns for deliverables DataTable
    const deliverablesColumns = [
        {
            key: 'index',
            title: '#',
            render: (deliverable, index) => (
                <span style={{ 
                    fontWeight: 600, 
                    color: "#64748b",
                    fontSize: 14
                }}>
                    {index + 1}
                </span>
            ),
            headerStyle: { width: '60px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        },
        {
            key: 'name',
            title: 'Milestone',
            render: (deliverable) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", lineHeight: 1.3 }}>{deliverable.name}</div>
                    {deliverable.description && (
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.3 }}>{deliverable.description}</div>
                    )}
                </div>
            ),
            headerStyle: { width: '600px', textAlign: 'left' },
            cellStyle: { textAlign: 'left' }
        },
        {
            key: 'endAt',
            title: 'Deadline',
            render: (deliverable) => (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    {deliverable.endAt ? (
                        <>
                            <div style={{ color: "#059669", fontWeight: 600, fontSize: 14 , textAlign: 'center'}}>{formatDate(deliverable.endAt, 'YYYY/MM/DD')} - {formatDate(deliverable.endAt, 'HH:mm')}</div>
                            {/* <div style={{ color: "#059669", fontWeight: 500, fontSize: 12 }}>{formatDate(deliverable.endAt, 'HH:mm')}</div> */}
                        </>
                    ) : (
                        <span style={{ color: "#dc2626", fontWeight: 600, background: "#fee2e2", padding: "2px 6px", borderRadius: 8, fontSize: 14 }}>No deadline</span>
                    )}
                </div>
            ),
            headerStyle: { width: '250px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        },
        {
            key: 'items',
            title: 'Items',
            render: (deliverable) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span style={{ 
                        fontWeight: 600, 
                        color: "#374151", 
                        background: "#e0f2fe", 
                        padding: "4px 10px", 
                        borderRadius: 12, 
                        fontSize: 13 
                    }}>
                        {Array.isArray(deliverable.deliveryItems) ? deliverable.deliveryItems.length : 0} items
                    </span>
                </div>
            ),
            headerStyle: { width: '150px', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        },
        {
            key: 'itemNames',
            title: 'Item names',
            render: (deliverable) => (
                Array.isArray(deliverable.deliveryItems) && deliverable.deliveryItems.length > 0 ? (
                    <div style={{ fontSize: 14, color: "#374151", textAlign: 'center' }}>
                        {deliverable.deliveryItems.map((it) => it.name).join(', ')}
                    </div>
                ) : (
                    <span style={{ color: "#64748b", fontSize: 14 , justifyContent: 'center'}}>No items</span>
                )
            ),
            headerStyle: { width: 'auto', textAlign: 'center' },
            cellStyle: { textAlign: 'center' }
        }
    ];

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
        if (editingItems.length === 0) {
            setModalError("At least one item is required");
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
            await updateMilestone(payload);
            setIsModalOpen(false);
            // refetch
            const res = await getMilestonesByMajor(selectedMajorId);
            const list = Array.isArray(res?.data) ? res.data : [];
            // Sort milestones: those with deadline first (by deadline), then those without deadline (by createAt)
            const sortedList = list.sort((a, b) => {
                // Milestones with deadline go first
                if (a.deadline && !b.deadline) return -1;
                if (!a.deadline && b.deadline) return 1;
                // Both have deadline: sort by deadline (ascending - earlier deadline first)
                if (a.deadline && b.deadline) {
                    return compareDeadlines(a.deadline, b.deadline);
                }
                // Both don't have deadline: sort by createAt (ascending - older first)
                if (!a.deadline && !b.deadline) {
                    if (a.createAt && b.createAt) {
                        return new Date(a.createAt) - new Date(b.createAt);
                    }
                }
                return 0;
            });
            setMilestones(sortedList);
            // also refresh deliverables of current semester
            if (currentSemester?.id) {
                const deliverRes = await getDeliverablesByMajorAndSemester(selectedMajorId, currentSemester.id);
                const deliverList = Array.isArray(deliverRes) ? deliverRes : [];
                setDeliverables(deliverList);
            }
            
        } catch (err) {
            setModalError(err?.message || "Failed to save deadline");
        }
    }


    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <h2 style={{ margin: 0, flex: 1 }}>Delivery Milestones</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
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
                            minWidth: "120px"
                        }}
                    >
                        {majors.map((m) => (
                            <option key={m.id} value={m.id}>{m.code}</option>
                        ))}
                    </select>
                </div>
            </div>
            <p style={{ marginTop: 0, color: "#64748b" }}>Manage and track delivery timelines for Capstone milestones.</p>

            {/* Milestone List */}
            <div style={{ marginBottom: 24 }}>
                <DataTable
                    columns={milestoneColumns}
                    data={milestones}
                    emptyMessage="No milestones found for selected major"
                    showIndex={false}
                />
            </div>


            {/* Modal for set deadline */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} showCloseButton={false}>
                <form onSubmit={saveDeadline} style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 16,
                    width: "800px",
                    maxWidth: "95vw",
                    padding:16
                }}>
                    <h3 style={{ margin: 0 }}>
                        {selectedMilestone && selectedMilestone.deadline ? "Edit Deliverable Deadline" : "Save Deliverable Deadline"}
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
                                             {selectedMilestone.deadline}
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

                                        {/* Deadline Settings */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 , padding:16}}>
                        <span style={{ fontWeight: 600 }}>Set Deadline:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Week</label>
                                <select 
                                    value={modalWeek} 
                                    onChange={(e) => setModalWeek(Number(e.target.value))}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        outline: "none"
                                    }}
                                >
                                    {Array.from({ length: weeks }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Day</label>
                                <select 
                                    value={modalDay} 
                                    onChange={(e) => setModalDay(e.target.value)}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        outline: "none"
                                    }}
                                >
                                    {DAYS.map((day) => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Time</label>
                                <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

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
                                {selectedMilestone && selectedMilestone.deadline ? "Update" : "Save Deadline"}
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

                <DataTable
                    columns={deliverablesColumns}
                    data={deliverables}
                    emptyMessage="No deliverables for selected major in this semester"
                    showIndex={false}
                />
            </div>
        </div>
    );
}
