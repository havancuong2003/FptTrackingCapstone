import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import client from "../../../utils/axiosClient";
import { useNavigate } from "react-router-dom";

export default function Tracking() {
    const navigate = useNavigate();
    const [majors, setMajors] = React.useState([]);
    const [selectedMajorId, setSelectedMajorId] = React.useState("");
    const [selectedSemester, setSelectedSemester] = React.useState("FALL25");
    const [search, setSearch] = React.useState("");
    const [groups, setGroups] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [loading, setLoading] = React.useState(false);

    // Mock semesters - you can replace with API call if needed
    const semesters = [
        { value: "FALL25", label: "FALL25" },
        { value: "SP25", label: "SP25" },
        { value: "SU25", label: "SU25" },
    ];

    // Load majors on mount
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

    // Load groups when filters change
    React.useEffect(() => {
        let mounted = true;
        async function loadGroups() {
            setLoading(true);
            try {
                const url = `https://160.30.21.113:5000/api/v1/Staff/capstone-groups?page=${page}&pageSize=${pageSize}`;
                const res = await client.get(url);
                const data = res?.data?.data || {};
                if (!mounted) return;
                console.log("Groups data:", data);
                setGroups(Array.isArray(data.items) ? data.items : []);
                setTotal(data.total || 0);
            } catch (err) {
                console.error("Error loading groups:", err);
                if (!mounted) return;
                setGroups([]);
                setTotal(0);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadGroups();
        return () => {
            mounted = false;
        };
    }, [page, pageSize]);

    // Filter groups based on search and selected filters
    const filteredGroups = React.useMemo(() => {
        const lower = search.trim().toLowerCase();
        const selectedMajor = majors.find((m) => String(m.id) === String(selectedMajorId));
        
        return groups.filter((group) => {
            // Major filter: if no major selected, show all; otherwise match by major name
            const majorMatch = !selectedMajor || group.major === selectedMajor.name;
            
            // Semester filter: if no semester selected, show all; otherwise match by term
            const semesterMatch = !selectedSemester || group.term === selectedSemester;
            
            // Search filter: search in courseCode (group name), major, or group ID
            const searchMatch = 
                lower === "" ||
                (group.courseCode || "").toLowerCase().includes(lower) ||
                (group.major || "").toLowerCase().includes(lower) ||
                (`GR${String(group.id).padStart(2, "0")}`).toLowerCase().includes(lower);
            
            return majorMatch && semesterMatch && searchMatch;
        });
    }, [groups, selectedMajorId, selectedSemester, search, majors]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    function handleTracking(groupId) {
        // Navigate to group tracking page
        navigate(`/staff/tracking/group/${groupId}`);
    }

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>Capstone Tracking</h1>
            
            {/* Filter and Search Bar */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr",
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
                    <span style={{ fontWeight: 600 }}>Code:</span>
                    <div style={{ width: 120 }}>
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

                {/* Semester select */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
                    <span style={{ fontWeight: 600 }}>Semester:</span>
                    <div style={{ width: 100 }}>
                        <Select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            {semesters.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Search box with icon */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="Search for Capstone groups by Project Name or by Group ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", paddingRight: 40 }}
                        />
                    </div>
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

            {/* Groups Table */}
            <div
                style={{
                    overflow: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    marginBottom: 16,
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
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
                                No
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
                                Project Name
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
                                Member
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                Mentor
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                Tracking
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredGroups.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                                    No groups found
                                </td>
                            </tr>
                        ) : (
                            filteredGroups.map((group, idx) => (
                                <tr key={group.id}>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        {(page - 1) * pageSize + idx + 1}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        GR{String(group.id).padStart(2, "0")}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {group.courseCode || "N/A"}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        {group.major || "N/A"}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        {group.studentCount} 👤
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        {group.supervisor && group.supervisor.length > 0 
                                            ? group.supervisor.join(", ") 
                                            : "N/A"}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        <Button
                                            size="sm"
                                            onClick={() => handleTracking(group.id)}
                                        >
                                            Tracking
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Number of rows:</span>
                    <Select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        style={{ width: 80 }}
                    >
                        <option value={1}>1</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </Select>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Prev
                    </Button>
                    
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                            <Button
                                key={pageNum}
                                variant={page === pageNum ? "primary" : "ghost"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
