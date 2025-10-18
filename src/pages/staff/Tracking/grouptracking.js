import React from 'react';
import { useParams } from 'react-router-dom';
import Select from "../../../components/Select/Select";
import Button from "../../../components/Button/Button";
import client from "../../../utils/axiosClient";
import { mockGroupTrackingApi } from "../../../mocks/mockstaff/groupTrackingApiResponse";

export default function GroupTracking() {
    // Get groupId from URL parameters
    const { groupId } = useParams();
    
    // Control variable for mock data vs API
    const USE_MOCKDATA = false;
    // State for API data
    const [apiData, setApiData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [selectedWeek, setSelectedWeek] = React.useState('');

    // API call function
    const fetchGroupTrackingData = async (groupId, startDate, endDate) => {
        try {
            setLoading(true);
            setError(null);
            // // parse groupID to string
            // groupId = String(groupId);

            // request to api
            const response = await client.get('/Staff/group-tracking', {
                params: {
                    groupid: groupId,
                    startdate: startDate,
                    enddate: endDate
                }
            });
            // Sử dụng mock API thay vì gọi API thật
            // const response = await mockGroupTrackingApi(groupId, startDate, endDate);
            
            // API trả về cấu trúc: response.data.status và response.data.da    ta
            if (response.data.status === 200) {
                setApiData(response.data.data);
                // Chỉ set currentWeek lần đầu khi chưa có selectedWeek
                if (response.data.data.currentWeek && !selectedWeek) {
                    setSelectedWeek(response.data.data.currentWeek);
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch data');
            }
        } catch (err) {
            setError(err.message || 'Error fetching data');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Extract dates from selected week
    const extractDatesFromWeek = (weekString) => {
        const dateMatch = weekString.match(/(\d{2}\/\d{2}\/\d{4}) - (\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            return {
                startDate: dateMatch[1],
                endDate: dateMatch[2]
            };
        }
        return null;
    };

    // Effect to fetch data when component mounts
    React.useEffect(() => {
        if (!USE_MOCKDATA && groupId) {
            // Gọi API ngay khi component mount với groupId từ URL params
            fetchGroupTrackingData(groupId, '29/09/2025', '05/10/2025'); // Default dates for Week 3
        }
    }, [groupId]); // Chạy khi groupId thay đổi

    // Effect để gọi API khi user thay đổi week thủ công
    React.useEffect(() => {
        if (!USE_MOCKDATA && apiData && groupId) {
            // Chỉ gọi API khi đã có data từ lần đầu và user thay đổi week
            const dates = extractDatesFromWeek(selectedWeek);
            if (dates) {
                fetchGroupTrackingData(groupId, dates.startDate, dates.endDate);
            }
        }
    }, [selectedWeek, groupId]); // Chạy khi selectedWeek hoặc groupId thay đổi

    // Data source - either mock or API
    const weeks = USE_MOCKDATA ? [
        { value: "Week 1: 15/09/2025 - 21/09/2025", label: "Week 1: 15/09/2025 - 21/09/2025" },
        { value: "Week 2: 22/09/2025 - 28/09/2025", label: "Week 2: 22/09/2025 - 28/09/2025" },
        { value: "Week 9: 29/09/2025 - 05/10/2025", label: "Week 3: 29/09/2025 - 05/10/2025" },
        { value: "Week 4: 06/10/2025 - 12/10/2025", label: "Week 4: 06/10/2025 - 12/10/2025" },
    ] : (apiData?.weeks || []);

    const timeSlots = USE_MOCKDATA ? [
        "00:00 - 04:00",
        "04:00 - 08:00", 
        "08:00 - 12:00",
        "12:00 - 16:00",
        "16:00 - 20:00",
        "20:00 - 24:00"
    ] : (apiData?.timeSlots || []);

    const days = USE_MOCKDATA ? [
        { name: "Monday", date: "22/09" },
        { name: "Tuesday", date: "23/09" },
        { name: "Wednesday", date: "24/09" },
        { name: "Thursday", date: "25/09" },
        { name: "Friday", date: "26/09" },
        { name: "Saturday", date: "27/09" },
        { name: "Sunday", date: "28/09" }
    ] : (apiData?.days || []);

    // Data source - either mock or API
    const groupMembers = USE_MOCKDATA ? [
        { id: "SE00001", name: "Nguyen Van A", isLeader: true },
        { id: "SE00002", name: "Nguyen Van B", isLeader: false },
        { id: "SE00003", name: "Nguyen Van C", isLeader: false },
        { id: "SE00004", name: "Nguyen Van D", isLeader: false },
        { id: "SE00005", name: "Nguyen Van E", isLeader: false },
    ] : (apiData?.groupMembers || []);

    const milestones = USE_MOCKDATA ? [
        { name: "Report 1", deadline: "23:59 - 28/09/2025", status: "submitted" },
        { name: "Report 2", deadline: "23:59 - 12/10/2025", status: "late" },
        { name: "Report 3, Project Breakdown", deadline: "23:59 - 26/10/2025", status: "not-submitted" },
        { name: "Report 4", deadline: "23:59 - 09/11/2025", status: "not-submitted" },
        { name: "Report 5", deadline: "23:59 - 23/11/2025", status: "not-submitted" },
        { name: "Report 6, Test Document", deadline: "23:59 - 07/12/2025", status: "not-submitted" },
        { name: "Report 7", deadline: "23:59 - 21/12/2025", status: "not-submitted" },
    ] : (apiData?.milestones || []);

    function getStatusIcon(status) {
        switch (status) {
            case "submitted":
                return { icon: "✓", color: "#059669", text: "Submitted" };
            case "late":
                return { icon: "⚠", color: "#d97706", text: "Late Submitted" };
            case "not-submitted":
                return { icon: "✗", color: "#dc2626", text: "Not Submitted" };
            default:
                return { icon: "?", color: "#64748b", text: "Unknown" };
        }
    }

    // Show loading state
    if (loading) {
        return (
            <div style={{ padding: 16, textAlign: 'center' }}>
                <div>Loading...</div>
            </div>
        );
    }

    // Show error if no groupId
    if (!groupId) {
        return (
            <div style={{ padding: 16 }}>
                <div style={{ color: '#dc2626', marginBottom: 16 }}>
                    Error: No group ID provided
                </div>
                <p>Please navigate to this page with a valid group ID.</p>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div style={{ padding: 16 }}>
                <div style={{ color: '#dc2626', marginBottom: 16 }}>
                    Error: {error}
                </div>
                <Button onClick={() => {
                    const dates = extractDatesFromWeek(selectedWeek);
                    if (dates && groupId) {
                        fetchGroupTrackingData(groupId, dates.startDate, dates.endDate);
                    }
                }}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div style={{ padding: 16 }}>
            {/* Project Details Section */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                    <h2 style={{ margin: 0, color: "#374151" }}>SEP490 &gt; {groupId || 'Loading...'}</h2>
                    <h3 style={{ margin: 0, color: "#374151" }}>
                        Project Name: {apiData?.projectName || 'Loading...'}
                    </h3>
                </div>
                
                <p style={{ margin: "0 0 16px 0", color: "#64748b", lineHeight: 1.6 }}>
                    {apiData?.projectDescription || 'Loading project description...'}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>Week:</span>
                        <Select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            style={{ width: 280 }}
                        >
                            {weeks.map((week) => (
                                <option key={week.value} value={week.value}>
                                    {week.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>
                            Mentor: {apiData?.mentor || 'Loading...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#f9fafb" }}>
                            <tr>
                                <th style={{ padding: 12, border: "1px solid #e5e7eb", width: 120, textAlign: "left" }}>Time</th>
                                {days.map((day) => (
                                    <th key={day.name} style={{ padding: 12, border: "1px solid #e5e7eb", textAlign: "center", minWidth: 120 }}>
                                        {day.name}<br />
                                        <span style={{ fontSize: 12, color: "#64748b" }}>({day.date})</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((timeSlot, timeIndex) => (
                                <tr key={timeSlot}>
                                    <td style={{ padding: 12, border: "1px solid #e5e7eb", background: "#f8fafc", fontWeight: 600 }}>
                                        {timeSlot}
                                    </td>
                                    {days.map((day, dayIndex) => {
                                        // Show milestone only in Sunday 20:00-24:00 slot
                                        const showMilestone = day.name === "Sunday" && timeIndex === 5;
                                        return (
                                            <td key={day.name} style={{ padding: 8, border: "1px solid #e5e7eb", minHeight: 80, verticalAlign: "top" }}>
                                                {showMilestone && (
                                                    <div style={{ 
                                                        background: "#f0f9ff", 
                                                        border: "1px solid #0ea5e9", 
                                                        borderRadius: 6, 
                                                        padding: 8,
                                                        fontSize: 12
                                                    }}>
                                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Milestone: Report 1</div>
                                                        <div style={{ marginBottom: 4 }}>Deadline: 23:59</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                                            <span style={{ color: "#059669" }}>●</span>
                                                            <span style={{ color: "#059669", fontWeight: 600 }}>Submitted</span>
                                                        </div>
                                                        <div style={{ marginBottom: 4 }}>Time: 23h40</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                                            <span>💬</span>
                                                            <span>Comment: 1</span>
                                                        </div>
                                                        <Button size="sm" style={{ fontSize: 10, padding: "4px 8px" }}>
                                                            Download
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Group Members and Deliverable Milestones */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Group Members */}
                <div>
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Group Members:</h3>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>No</th>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>ID</th>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupMembers.map((member, index) => (
                                    <tr key={member.id}>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{index + 1}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{member.id}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 4 }}>
                                            {member.name}
                                            {member.isLeader && <span style={{ color: "#f59e0b" }}>⭐</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Deliverable Milestones */}
                <div>
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Deliverable Milestones:</h3>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>No</th>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>Milestone</th>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>Deadline</th>
                                    <th style={{ padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {milestones.map((milestone, index) => {
                                    const statusInfo = getStatusIcon(milestone.status);
                                    return (
                                        <tr key={index}>
                                            <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{index + 1}</td>
                                            <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{milestone.name}</td>
                                            <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{milestone.deadline}</td>
                                            <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
                                                <span style={{ color: statusInfo.color, fontSize: 16 }}>
                                                    {statusInfo.icon}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Status Legend */}
                    <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#059669" }}>✓</span>
                            <span>: Submitted</span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#d97706" }}>⚠</span>
                            <span>: Late Submitted</span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#dc2626" }}>✗</span>
                            <span>: Not Submitted</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
} 