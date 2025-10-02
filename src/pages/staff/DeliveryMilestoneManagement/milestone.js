import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";

// Mock course codes
const COURSE_CODES = [
    { value: "ALL", label: "All" },
    { value: "SEP490", label: "SEP490" },
    { value: "SEP491", label: "SEP491" },
    { value: "SEP492", label: "SEP492" },
];

// Seed mock milestones
function createMockMilestones() {
    const base = [
        {
            id: "SE01",
            code: "SEP490",
            name: "Report 1",
            description:
                "Provides an overview of the project, including scope, objectives, target users.",
        },
        {
            id: "SE02",
            code: "SEP490",
            name: "Report 2",
            description:
                "Describes the general perspective of the system, including its main functions.",
        },
        {
            id: "SE03",
            code: "SEP490",
            name: "Report 3",
            description:
                "Lists and details the core features of the system with explanations.",
        },
        {
            id: "SE04",
            code: "SEP490",
            name: "Project Breakdown Document",
            description:
                "Outlines the project structure by breaking it down into smaller tasks and modules.",
        },
        {
            id: "SE05",
            code: "SEP490",
            name: "Report 4",
            description:
                "Specifies the requirements for external interfaces including user interfaces.",
        },
        {
            id: "SE06",
            code: "SEP490",
            name: "Report 5",
            description:
                "Outlines both functional and non-functional requirements of the system.",
        },
        {
            id: "SE07",
            code: "SEP490",
            name: "Report 6",
            description:
                "Presents main system use cases with supporting UML diagrams.",
        },
        {
            id: "SE08",
            code: "SEP490",
            name: "Test Document",
            description:
                "Describes testing strategy, test cases, and expected results for validation.",
        },
        {
            id: "SE09",
            code: "SEP490",
            name: "Report 7",
            description:
                "Consolidates previous reports into a complete, well-structured SRS document.",
        },
    ];

    // Duplicate a few to other course codes with different dates
    const now = Date.now();
    return base
        .concat(
            base.slice(0, 4).map((m, idx) => ({
                ...m,
                id: `SX${String(idx + 1).padStart(2, "0")}`,
                code: "SEP491",
            })),
            base.slice(0, 3).map((m, idx) => ({
                ...m,
                id: `SY${String(idx + 1).padStart(2, "0")}`,
                code: "SEP492",
            }))
        )
        .map((m, i) => ({
            ...m,
            createdAt: new Date(now - (i + 1) * 86400000).toISOString(),
            updatedAt: new Date(now - (i + 1) * 3600000).toISOString(),
        }));
}

function Milestone() {
    const [milestones, setMilestones] = React.useState(createMockMilestones());
    const [selectedCode, setSelectedCode] = React.useState("SEP490");
    const [search, setSearch] = React.useState("");
    const [sortBy, setSortBy] = React.useState("name"); // name | createdAt | updatedAt

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState(null);

    const filtered = React.useMemo(() => {
        const lower = search.trim().toLowerCase();
        let list = milestones.filter((m) => {
            const codeOk = selectedCode === "ALL" || m.code === selectedCode;
            const searchOk =
                lower === "" ||
                m.code.toLowerCase().includes(lower) ||
                m.name.toLowerCase().includes(lower);
            return codeOk && searchOk;
        });

        list.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "createdAt")
                return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === "updatedAt")
                return new Date(a.updatedAt) - new Date(b.updatedAt);
            return 0;
        });

        return list;
    }, [milestones, selectedCode, search, sortBy]);

    function openCreate() {
        setEditingItem({
            id: "",
            code: selectedCode === "ALL" ? "SEP490" : selectedCode,
            name: "",
            description: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setIsModalOpen(true);
    }

    function openEdit(item) {
        setEditingItem({ ...item });
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingItem(null);
    }

    function saveItem(e) {
        e.preventDefault();
        if (!editingItem) return;
        if (!editingItem.name.trim()) return;

        setMilestones((prev) => {
            const exists = prev.some(
                (m) => m.id === editingItem.id && m.code === editingItem.code
            );
            if (exists) {
                return prev.map((m) =>
                    m.id === editingItem.id && m.code === editingItem.code
                        ? {
                              ...editingItem,
                              updatedAt: new Date().toISOString(),
                          }
                        : m
                );
            }
            const newId =
                editingItem.id ||
                `M${String(prev.length + 1).padStart(3, "0")}`;
            return [
                ...prev,
                {
                    ...editingItem,
                    id: newId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
        });
        closeModal();
    }

    return (
        <div style={{ padding: 16 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
                    <Select
                        value={selectedCode}
                        onChange={(e) => setSelectedCode(e.target.value)}
                    >
                        {COURSE_CODES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </Select>
                </div>

                <div style={{ flex: 1 }}>
                    <Input
                        placeholder="Search for Capstone Milestone by Code or Milestone Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Sort by:</span>
                    <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name">Name</option>
                        <option value="createdAt">Created time</option>
                        <option value="updatedAt">Updated time</option>
                    </Select>
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
                                }}
                            >
                                No.
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                ID
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                Code
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
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
                                }}
                            >
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((m, idx) => (
                            <tr key={`${m.code}-${m.id}`}>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    {idx + 1}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    {m.id}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    {m.code}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                        fontWeight: 600,
                                    }}
                                >
                                    {m.name}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                        color: "#334155",
                                    }}
                                >
                                    {m.description}
                                </td>
                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <Button
                                        size="sm"
                                        onClick={() => openEdit(m)}
                                    >
                                        Edit ✎
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
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

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 16,
                }}
            >
                <Button variant="secondary" onClick={openCreate}>
                    Create +
                </Button>
            </div>

            <Modal open={isModalOpen} onClose={closeModal}>
                {editingItem && (
                    <form
                        onSubmit={saveItem}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <h3 style={{ margin: 0 }}>
                            {editingItem.id
                                ? "Edit Milestone"
                                : "Create Milestone"}
                        </h3>
                        <label
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <span>Course code</span>
                            <Select
                                value={editingItem.code}
                                onChange={(e) =>
                                    setEditingItem({
                                        ...editingItem,
                                        code: e.target.value,
                                    })
                                }
                            >
                                {COURSE_CODES.filter(
                                    (c) => c.value !== "ALL"
                                ).map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <span>Milestone name</span>
                            <Input
                                value={editingItem.name}
                                onChange={(e) =>
                                    setEditingItem({
                                        ...editingItem,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter milestone name"
                            />
                        </label>
                        <label
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <span>Description</span>
                            <textarea
                                value={editingItem.description}
                                onChange={(e) =>
                                    setEditingItem({
                                        ...editingItem,
                                        description: e.target.value,
                                    })
                                }
                                rows={4}
                                style={{
                                    padding: 8,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 6,
                                }}
                                placeholder="Describe milestone"
                            />
                        </label>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 8,
                                marginTop: 8,
                            }}
                        >
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={closeModal}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

export default Milestone;
