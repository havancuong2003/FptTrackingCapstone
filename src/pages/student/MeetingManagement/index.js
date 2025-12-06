import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import Textarea from "../../../components/Textarea/Textarea";
import client from "../../../utils/axiosClient";
import DataTable from "../../../components/DataTable/DataTable";
import { useNavigate } from "react-router-dom";
import { uploadTaskAttachment } from "../../../api/tasks";
import { sendEmail } from "../../../email/api";
import { baseTemplate } from "../../../email/templates";

export default function StudentMeetingManagement() {
    const navigate = useNavigate();
    const [meetings, setMeetings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedMeeting, setSelectedMeeting] = React.useState(null);
    const [attendanceData, setAttendanceData] = React.useState({}); // { meetingScheduleDateId: { attendance: string } }
    const [userRole, setUserRole] = React.useState("Student"); // Student, Secretary, Supervisor
    const [showMinuteModal, setShowMinuteModal] = React.useState(false);
    const [minuteData, setMinuteData] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [userInfo, setUserInfo] = React.useState(null);
    const [formData, setFormData] = React.useState({
        startAt: "",
        endAt: "",
        attendance: "",
        issue: "",
        meetingContent: "",
        other: "",
    });
    const [formErrors, setFormErrors] = React.useState({});
    const [meetingMinutes, setMeetingMinutes] = React.useState({}); // Lưu trữ meeting minutes theo meetingId
    // Meeting Issues state
    const [meetingIssues, setMeetingIssues] = React.useState([]);
    const [pendingIssues, setPendingIssues] = React.useState([]); // Lưu các issue tạm chưa tạo
    const [showIssueModal, setShowIssueModal] = React.useState(false);
    const [issueForm, setIssueForm] = React.useState({
        title: "",
        description: "",
        assignee: "",
        priority: "low",
        deadline: "",
        reviewer: "",
    });
    const [assigneeOptions, setAssigneeOptions] = React.useState([]);
    const [reviewerOptions, setReviewerOptions] = React.useState([]);
    const [groupInfo, setGroupInfo] = React.useState(null);
    // State cho file đính kèm khi tạo issue
    const [createIssueFiles, setCreateIssueFiles] = React.useState([]);
    const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
    const [loadingMinuteModal, setLoadingMinuteModal] = React.useState(false);
    const [previousMinuteData, setPreviousMinuteData] = React.useState(null); // Previous meeting minutes
    const [showPreviousMinuteModal, setShowPreviousMinuteModal] =
        React.useState(false); // Modal for previous meeting minutes
    const [previousMinuteIssues, setPreviousMinuteIssues] = React.useState([]); // Issues from previous meeting
    const [currentPage, setCurrentPage] = React.useState(1); // Pagination
    const ITEMS_PER_PAGE = 5;
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [showEditScheduleModal, setShowEditScheduleModal] =
        React.useState(false);
    const [editingMeeting, setEditingMeeting] = React.useState(null);
    const [scheduleForm, setScheduleForm] = React.useState({
        meetingDate: "",
        startAt: "",
        endAt: "",
        description: "",
    });
    const [weekDays, setWeekDays] = React.useState([]);
    const autoSaveIntervalRef = React.useRef(null); // Auto save interval ref
    const [lastSaveTime, setLastSaveTime] = React.useState(null); // Track last save time
    const visibilityChangeHandlerRef = React.useRef(null); // Ref để lưu visibility change handler
    const lastAutoSaveTimeRef = React.useRef(null); // Ref để track thời gian auto-save cuối cùng
    const formDataRef = React.useRef(formData); // Ref để lưu formData mới nhất
    const attendanceListRef = React.useRef(attendanceList); // Ref để lưu attendanceList mới nhất
    const selectedMeetingRef = React.useRef(selectedMeeting); // Ref để lưu selectedMeeting mới nhất
    const minuteDataRef = React.useRef(minuteData); // Ref để lưu minuteData mới nhất
    const isEditingRef = React.useRef(isEditing); // Ref để lưu isEditing mới nhất
    const pendingIssuesRef = React.useRef(pendingIssues); // Ref để lưu pendingIssues mới nhất
    const groupInfoRef = React.useRef(groupInfo); // Ref để lưu groupInfo mới nhất
    const meetingContentRef = React.useRef(null); // Ref cho ô nhập Meeting Content

    // API Base URL
    const API_BASE_URL = "https://160.30.21.113:5000/api/v1";

    // Cập nhật refs khi state thay đổi
    React.useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    React.useEffect(() => {
        attendanceListRef.current = attendanceList;
    }, [attendanceList]);

    React.useEffect(() => {
        selectedMeetingRef.current = selectedMeeting;
    }, [selectedMeeting]);

    React.useEffect(() => {
        minuteDataRef.current = minuteData;
    }, [minuteData]);

    React.useEffect(() => {
        isEditingRef.current = isEditing;
    }, [isEditing]);

    React.useEffect(() => {
        pendingIssuesRef.current = pendingIssues;
    }, [pendingIssues]);

    React.useEffect(() => {
        groupInfoRef.current = groupInfo;
    }, [groupInfo]);

    React.useEffect(() => {
        // Lấy thông tin user và meetings
        fetchUserInfo();

        // Handle window resize for responsive
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            // Cleanup auto save interval
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await client.get(`${API_BASE_URL}/auth/user-info`);

            if (response.data.status === 200) {
                const userData = response.data.data;
                setUserInfo(userData);
                setUserRole(userData.roleInGroup || userData.role);

                // Lấy danh sách meetings sau khi có thông tin user
                if (userData.groups && userData.groups.length > 0) {
                    await Promise.all([
                        fetchMeetings(userData.groups[0]),
                        fetchAssigneesByGroup(userData.groups[0]),
                        fetchReviewersByGroup(userData.groups[0]),
                    ]);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            console.error(
                "Error details:",
                error.response?.data || error.message
            );
            setLoading(false);
        }
    };

    // Lấy danh sách assignee từ group (sinh viên trong nhóm)
    const fetchAssigneesByGroup = async (groupId) => {
        try {
            const res = await client.get(
                `${API_BASE_URL}/Staff/capstone-groups/${groupId}`
            );
            if (res.data.status === 200) {
                const students = Array.isArray(res.data.data?.students)
                    ? res.data.data.students
                    : [];
                setAssigneeOptions(
                    students.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                    }))
                );
            }
        } catch {}
    };

    // Lấy reviewer (supervisors + students) theo group để chọn reviewer cho issue
    const fetchReviewersByGroup = async (groupId) => {
        try {
            const res = await client.get(
                `${API_BASE_URL}/Staff/capstone-groups/${groupId}`
            );
            if (res.data.status === 200) {
                const groupData = res.data.data;
                const reviewers = [];
                if (Array.isArray(groupData.supervisorsInfor)) {
                    groupData.supervisorsInfor.forEach((sp) =>
                        reviewers.push({
                            value: String(sp.id),
                            label: `${sp.name} (Supervisor)`,
                        })
                    );
                }
                if (Array.isArray(groupData.students)) {
                    groupData.students.forEach((st) =>
                        reviewers.push({
                            value: String(st.id),
                            label: `${st.name} (Student)`,
                        })
                    );
                }
                setReviewerOptions(reviewers);
            }
        } catch {}
    };

    // Fetch attendance data for all meetings
    const fetchAttendanceData = async (groupId) => {
        try {
            const response = await client.get(
                `${API_BASE_URL}/MeetingMinute/attendance?groupId=${groupId}`
            );
            if (response.data.status === 200) {
                const data = response.data.data || [];
                const attendanceMap = {};
                data.forEach((item) => {
                    attendanceMap[item.meetingScheduleDateId] = item.attendance;
                });
                setAttendanceData(attendanceMap);
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
        }
    };

    // Lấy danh sách meetings
    const fetchMeetings = async (groupId) => {
        try {
            const response = await client.get(
                `${API_BASE_URL}/Student/Meeting/group/${groupId}/schedule-dates`
            );

            if (response.data.status === 200) {
                const meetingsData = response.data.data;

                // Fetch attendance data
                await fetchAttendanceData(groupId);

                if (meetingsData && meetingsData.length > 0) {
                    // API đã trả về isMinute, không cần gọi API để check nữa
                    setMeetings(meetingsData);

                    // Auto navigate to page with upcoming meeting (meeting sắp diễn ra theo thời gian)
                    const now = new Date();
                    // Tìm cuộc họp sắp tới gần nhất (meetingDate >= now và chưa họp)
                    let upcomingIndex = -1;
                    for (let i = 0; i < meetingsData.length; i++) {
                        const meeting = meetingsData[i];
                        const meetingDate = new Date(meeting.meetingDate);
                        // Cuộc họp sắp diễn ra: ngày họp >= hiện tại và chưa đánh dấu là đã họp
                        if (meetingDate >= now && meeting.isMeeting !== true) {
                            upcomingIndex = i;
                            break;
                        }
                    }

                    // Nếu không tìm thấy cuộc họp sắp tới, tìm cuộc họp gần nhất chưa họp
                    if (upcomingIndex === -1) {
                        for (let i = 0; i < meetingsData.length; i++) {
                            if (meetingsData[i].isMeeting !== true) {
                                upcomingIndex = i;
                                break;
                            }
                        }
                    }

                    if (upcomingIndex !== -1) {
                        const pageNumber =
                            Math.floor(upcomingIndex / ITEMS_PER_PAGE) + 1;
                        setCurrentPage(pageNumber);
                    }
                } else {
                    setMeetings([]);
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching meetings:", error);
            console.error(
                "Error details:",
                error.response?.data || error.message
            );
            setLoading(false);
        }
    };

    const isSecretary = userRole === "Secretary";
    const isSupervisor = userInfo?.role === "Supervisor";

    const joinMeeting = (meetingLink) => {
        window.open(meetingLink, "_blank");
    };

    // Hàm toggle isMeeting status
    const toggleMeetingStatus = async (meeting) => {
        if (!isSecretary) return;

        try {
            const newStatus = !meeting.isMeeting;
            setMeetings((prevMeetings) => {
                const updatedMeetings = prevMeetings.map((m) =>
                    m.id === meeting.id ? { ...m, isMeeting: newStatus } : m
                );
                return updatedMeetings;
            });

            const response = await client.put(
                `${API_BASE_URL}/Student/Meeting/update-is-meeting/${meeting.id}`,
                newStatus,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.data.status === 200) {
                // Refresh meetings data để đảm bảo sync với server
                if (userInfo?.groups && userInfo.groups.length > 0) {
                    await fetchMeetings(userInfo.groups[0]);
                }
                alert(
                    newStatus
                        ? "Meeting marked as completed!"
                        : "Meeting marked as not completed!"
                );
            } else {
                // Rollback nếu API không thành công
                setMeetings((prevMeetings) =>
                    prevMeetings.map((m) =>
                        m.id === meeting.id
                            ? { ...m, isMeeting: !newStatus }
                            : m
                    )
                );
            }
        } catch (error) {
            console.error("Error updating meeting status:", error);
            // Rollback khi có lỗi
            setMeetings((prevMeetings) =>
                prevMeetings.map((m) =>
                    m.id === meeting.id
                        ? { ...m, isMeeting: meeting.isMeeting }
                        : m
                )
            );
            alert("Error updating meeting status!");
        }
    };

    const downloadMinutes = (minutes) => {
        // Mock download
        const link = document.createElement("a");
        link.href = minutes.filePath;
        link.download = minutes.fileName;
        link.click();
    };

    // Hàm lấy biên bản họp
    const fetchMeetingMinute = async (meetingDateId) => {
        try {
            const response = await client.get(
                `${API_BASE_URL}/MeetingMinute?meetingDateId=${meetingDateId}`
            );
            if (response.data.status === 200) {
                return response.data.data; // Có thể là null nếu chưa có biên bản
            }
            return null;
        } catch (error) {
            console.error("Error fetching meeting minute:", error);
            return null;
        }
    };

    // Hàm tạo biên bản họp
    const createMeetingMinute = async (data) => {
        try {
            const response = await client.post(
                `${API_BASE_URL}/MeetingMinute`,
                data
            );
            return response.data;
        } catch (error) {
            console.error("Error creating meeting minute:", error);
            console.error(
                "Error details:",
                error.response?.data || error.message
            );
            throw error;
        }
    };

    // Hàm cập nhật biên bản họp
    const updateMeetingMinute = async (data) => {
        try {
            const response = await client.put(
                `${API_BASE_URL}/MeetingMinute`,
                data
            );
            return response.data;
        } catch (error) {
            console.error("Error updating meeting minute:", error);
            throw error;
        }
    };

    // Hàm xóa biên bản họp
    const deleteMeetingMinute = async (minuteId) => {
        try {
            const response = await client.delete(
                `${API_BASE_URL}/MeetingMinute/${minuteId}`
            );
            return response.data;
        } catch (error) {
            console.error("Error deleting meeting minute:", error);
            throw error;
        }
    };

    // Hàm lấy thông tin nhóm
    const fetchGroupInfo = async (groupId) => {
        try {
            const response = await client.get(
                `${API_BASE_URL}/Staff/capstone-groups/${groupId}`
            );
            if (response.data.status === 200) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error("Error fetching group info:", error);
            return null;
        }
    };

    // Hàm parse attendance text thành danh sách
    const parseAttendance = (attendanceText, students) => {
        if (!students || students.length === 0) {
            return [];
        }

        if (!attendanceText || !attendanceText.trim()) {
            // Nếu chưa có attendance text, tạo danh sách mặc định với tất cả đều không tham gia
            return students.map((student) => ({
                studentId: student.id,
                name: student.name,
                rollNumber: student.rollNumber,
                role: student.role || "",
                attended: false,
                reason: "",
            }));
        }

        // Parse format: "Name (RollNumber): Tham gia" hoặc "Name (RollNumber): Nghỉ - Lý do"
        const lines = attendanceText.split("\n").filter((line) => line.trim());
        const parsed = new Map();

        lines.forEach((line) => {
            const match = line.match(/^(.+?)\s*\(([^)]+)\):\s*(.+)$/);
            if (match) {
                const [, name, rollNumber, status] = match;
                const statusLower = status.toLowerCase();
                const isAbsent =
                    statusLower.includes("nghỉ") ||
                    statusLower.includes("vắng");
                let reason = "";

                if (isAbsent) {
                    // Extract reason after "Nghỉ - " or "vắng - "
                    const reasonMatch = status.match(
                        /(?:nghỉ|vắng)\s*-\s*(.+)/i
                    );
                    reason = reasonMatch
                        ? reasonMatch[1].trim()
                        : status.replace(/^(nghỉ|vắng)\s*-?\s*/i, "").trim();
                }

                parsed.set(rollNumber.trim(), {
                    name: name.trim(),
                    rollNumber: rollNumber.trim(),
                    attended: !isAbsent,
                    reason: reason,
                });
            }
        });

        // Tạo danh sách từ students, nếu có trong parsed thì dùng, không thì mặc định tham gia
        return students.map((student) => {
            const existing = parsed.get(student.rollNumber);
            if (existing) {
                return {
                    studentId: student.id,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    role: student.role || "",
                    attended: existing.attended,
                    reason: existing.reason,
                };
            }
            return {
                studentId: student.id,
                name: student.name,
                rollNumber: student.rollNumber,
                role: student.role || "",
                attended: false,
                reason: "",
            };
        });
    };

    // Hàm format attendance list thành text
    const formatAttendance = (attendanceList) => {
        if (!attendanceList || attendanceList.length === 0) return "";

        return attendanceList
            .map((item) => {
                if (item.attended) {
                    return `${item.name} (${item.rollNumber}): Tham gia`;
                } else {
                    return `${item.name} (${item.rollNumber}): Nghỉ - ${
                        item.reason || "Không có lý do"
                    }`;
                }
            })
            .join("\n");
    };

    // Hàm xác định màu sắc cho meeting card
    const getMeetingCardColor = (meeting) => {
        const now = new Date();
        const meetingDate = new Date(meeting.meetingDate);

        // Nếu đã họp -> màu xanh nhạt
        if (meeting.isMeeting === true) {
            return "#f0fdf4"; // Xanh nhạt
        }

        // Nếu chưa họp và gần nhất -> màu vàng nhạt
        if (meetingDate > now) {
            const timeDiff = meetingDate - now;
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
                // Trong vòng 7 ngày tới
                return "#fefce8"; // Vàng nhạt
            }
        }

        // Mặc định -> màu trắng
        return "#ffffff";
    };

    // Hàm xác định border color cho meeting card
    const getMeetingCardBorderColor = (meeting) => {
        const now = new Date();
        const meetingDate = new Date(meeting.meetingDate);

        // Nếu đã họp -> border xanh
        if (meeting.isMeeting === true) {
            return "#10b981"; // Xanh lá
        }

        // Nếu chưa họp và gần nhất -> border vàng
        if (meetingDate > now) {
            const timeDiff = meetingDate - now;
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
                // Trong vòng 7 ngày tới
                return "#f59e0b"; // Vàng
            }
        }

        // Mặc định -> border xám
        return "#e5e7eb";
    };

    // Hàm kiểm tra xem có đang trong ngày họp không
    const isWithinMeetingDay = (meeting) => {
        if (!meeting || !meeting.meetingDate) return false;
        const now = new Date();
        const meetingDate = new Date(meeting.meetingDate);

        // So sánh chỉ ngày, không so sánh giờ
        const nowDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const meetingDateOnly = new Date(
            meetingDate.getFullYear(),
            meetingDate.getMonth(),
            meetingDate.getDate()
        );

        return nowDate.getTime() === meetingDateOnly.getTime();
    };

    // Hàm kiểm tra quyền edit biên bản
    // Nếu đã có biên bản rồi thì chỉ được edit trong ngày họp (từ 00:00 đến 23:59:59)
    // Nếu chưa có biên bản thì có thể tạo bình thường
    const canEditMinute = () => {
        // Nếu đang edit biên bản đã có (isEditing && minuteData)
        if (isEditing && minuteData) {
            // Cho phép edit trong cả ngày họp (từ 00:00 đến 23:59:59)
            if (!selectedMeeting || !selectedMeeting.meetingDate) return false;
            const now = new Date();
            const meetingDate = new Date(selectedMeeting.meetingDate);

            // So sánh chỉ ngày, không so sánh giờ
            const nowDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
            const meetingDateOnly = new Date(
                meetingDate.getFullYear(),
                meetingDate.getMonth(),
                meetingDate.getDate()
            );

            // Cho phép edit nếu đang trong ngày họp hoặc chưa đến hết ngày họp
            // (nghĩa là nếu hôm nay là ngày họp hoặc chưa qua ngày họp)
            return nowDate.getTime() <= meetingDateOnly.getTime();
        }
        // Nếu chưa có biên bản (tạo mới) thì luôn cho phép
        return true;
    };

    // Hàm kiểm tra attendance của user hiện tại
    const getUserAttendanceStatus = (meeting) => {
        // Nếu meeting chưa diễn ra (isMeeting !== true hoặc meetingDate > now)
        const now = new Date();
        const meetingDate = new Date(meeting.meetingDate);
        if (meeting.isMeeting !== true || meetingDate > now) {
            return "-";
        }

        // Nếu đã diễn ra, kiểm tra attendance
        // Key trong attendanceData là meetingScheduleDateId (number)
        // Thử cả meetingScheduleDateId và meeting.id, và convert sang number để đảm bảo khớp
        const meetingKey = meeting.meetingScheduleDateId || meeting.id;
        // console.log('meetingKey', meetingKey);
        // Thử cả number và string key
        const attendanceText =
            attendanceData[meetingKey] ||
            attendanceData[Number(meetingKey)] ||
            attendanceData[String(meetingKey)];
        if (!attendanceText || !userInfo?.name) {
            return "-";
        }
        // console.log('attendanceText', attendanceText);
        // Parse attendance text để tìm user
        // Format: "Name (RollNumber): Status" hoặc "Name (RollNumber): Nghỉ - Lý do"
        const lines = attendanceText.split("\n").filter((line) => line.trim());
        const userName = (userInfo.name || "").trim();
        const userRollNumber = (
            userInfo.rollNumber ||
            userInfo.studentId ||
            userInfo.studentNumber ||
            ""
        ).trim();

        for (const line of lines) {
            // Kiểm tra theo tên hoặc rollNumber
            // So sánh đơn giản: tên hoặc rollNumber có trong dòng
            const matchesName = userName && line.includes(userName);
            const matchesRollNumber =
                userRollNumber && line.includes(userRollNumber);

            if (matchesName || matchesRollNumber) {
                // Tìm status trong dòng
                if (line.includes("Tham gia")) {
                    return "Attended";
                } else if (
                    line.includes("Nghỉ") ||
                    line.toLowerCase().includes("vắng")
                ) {
                    return "Absent";
                }
            }
        }

        return "-";
    };

    // Hàm xác định trạng thái meeting
    const getMeetingStatus = (meeting) => {
        const now = new Date();
        const meetingDate = new Date(meeting.meetingDate);

        if (meeting.isMeeting === true) {
            return "Completed";
        } else if (meetingDate < now) {
            return "Past";
        } else {
            return "Upcoming";
        }
    };

    const getMeetingStatusText = (status) => {
        switch (status) {
            case "Completed":
                return "Completed";
            case "Past":
                return "Upcoming";
            case "Upcoming":
                return "Upcoming";
            default:
                return "Unknown";
        }
    };

    // Hàm format datetime-local từ meeting date và time
    const formatDateTimeLocal = (meetingDate, timeString) => {
        if (!meetingDate || !timeString) return "";
        const date = new Date(meetingDate);
        const [hours, minutes] = timeString.split(":");
        date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    // Hàm convert API datetime (UTC+0) sang datetime-local format (UTC+7)
    const convertApiDateTimeToLocal = (dateTimeString) => {
        if (!dateTimeString) return "";
        const date = new Date(dateTimeString);
        // Cộng 7 tiếng để chuyển sang múi giờ VN
        const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

        const year = vnDate.getFullYear();
        const month = String(vnDate.getMonth() + 1).padStart(2, "0");
        const day = String(vnDate.getDate()).padStart(2, "0");
        const hour = String(vnDate.getHours()).padStart(2, "0");
        const minute = String(vnDate.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    // Hàm mở modal biên bản họp
    const openMinuteModal = async (meeting) => {
        // Reset tất cả state trước
        setSelectedMeeting(meeting);
        setMinuteData(null);
        setIsEditing(false);
        setGroupInfo(null);
        setAttendanceList([]);
        setPreviousMinuteData(null); // Reset biên bản trước đó
        setFormData({
            startAt: "",
            endAt: "",
            attendance: "",
            issue: "",
            meetingContent: "",
            other: "",
        });
        setFormErrors({});
        setLoadingMinuteModal(true);
        setShowMinuteModal(true);
        setLastSaveTime(null);

        // Clear existing auto save interval if any
        if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
            autoSaveIntervalRef.current = null;
        }

        try {
            // Fetch group info
            if (userInfo?.groups && userInfo.groups.length > 0) {
                const groupData = await fetchGroupInfo(userInfo.groups[0]);
                if (groupData) {
                    setGroupInfo(groupData);
                    const students = Array.isArray(groupData.students)
                        ? groupData.students
                        : [];

                    // Chỉ fetch meeting minute nếu isMinute === true
                    if (meeting.isMinute === true) {
                        const meetingMinute = await fetchMeetingMinute(
                            meeting.id
                        );
                        if (meetingMinute) {
                            setMinuteData(meetingMinute);

                            // Parse attendance từ text
                            const parsedAttendance = parseAttendance(
                                meetingMinute.attendance,
                                students
                            );
                            setAttendanceList(parsedAttendance);

                            setFormData({
                                startAt: meetingMinute.startAt
                                    ? convertApiDateTimeToLocal(
                                          meetingMinute.startAt
                                      )
                                    : formatDateTimeLocal(
                                          meeting.meetingDate,
                                          meeting.startAt
                                      ),
                                endAt: meetingMinute.endAt
                                    ? convertApiDateTimeToLocal(
                                          meetingMinute.endAt
                                      )
                                    : formatDateTimeLocal(
                                          meeting.meetingDate,
                                          meeting.endAt
                                      ),
                                attendance: meetingMinute.attendance || "",
                                issue: "",
                                meetingContent:
                                    meetingMinute.meetingContent || "",
                                other: meetingMinute.other || "",
                            });
                            setIsEditing(true);
                        } else {
                            // Nếu API báo có minute nhưng fetch không ra, reset form
                            setMinuteData(null);
                            const defaultAttendance = parseAttendance(
                                "",
                                students
                            );
                            setAttendanceList(defaultAttendance);
                            setFormData({
                                startAt: formatDateTimeLocal(
                                    meeting.meetingDate,
                                    meeting.startAt
                                ),
                                endAt: formatDateTimeLocal(
                                    meeting.meetingDate,
                                    meeting.endAt
                                ),
                                attendance: "",
                                issue: "",
                                meetingContent: "",
                                other: "",
                            });
                            setIsEditing(false);
                        }
                    } else {
                        // Chưa có minute, tạo mới với default time
                        setMinuteData(null);
                        const defaultAttendance = parseAttendance("", students);
                        setAttendanceList(defaultAttendance);
                        setFormData({
                            startAt: formatDateTimeLocal(
                                meeting.meetingDate,
                                meeting.startAt
                            ),
                            endAt: formatDateTimeLocal(
                                meeting.meetingDate,
                                meeting.endAt
                            ),
                            attendance: "",
                            issue: "",
                            meetingContent: "",
                            other: "",
                        });
                        setIsEditing(false);

                        // Tìm và load biên bản họp trước đó (nếu có)
                        if (meetings && meetings.length > 0) {
                            // Sắp xếp meetings theo ngày, tìm meeting trước meeting hiện tại có biên bản
                            const sortedMeetings = [...meetings].sort(
                                (a, b) =>
                                    new Date(a.meetingDate) -
                                    new Date(b.meetingDate)
                            );
                            const currentMeetingIndex =
                                sortedMeetings.findIndex(
                                    (m) => m.id === meeting.id
                                );

                            // Tìm meeting trước đó có isMinute === true
                            for (let i = currentMeetingIndex - 1; i >= 0; i--) {
                                const prevMeeting = sortedMeetings[i];
                                if (prevMeeting.isMinute === true) {
                                    try {
                                        const prevMinute =
                                            await fetchMeetingMinute(
                                                prevMeeting.id
                                            );
                                        if (prevMinute) {
                                            setPreviousMinuteData(prevMinute);
                                            break;
                                        }
                                    } catch (error) {
                                        console.error(
                                            "Error fetching previous meeting minute:",
                                            error
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Load meeting issues
            if (meeting.isMinute === true) {
                // Nếu đã có minute, fetch meeting minute để lấy id
                const meetingMinute = await fetchMeetingMinute(meeting.id);
                if (meetingMinute && meetingMinute.id) {
                    // Load issues bằng meeting minute id
                    const meetingTasks = await fetchMeetingIssues(
                        meetingMinute.id
                    );
                    setMeetingIssues(
                        Array.isArray(meetingTasks) ? meetingTasks : []
                    );
                } else {
                    setMeetingIssues([]);
                }
                setPendingIssues([]); // Reset pending issues khi xem biên bản đã có
            } else {
                // Nếu chưa có minute (tạo mới), load cả incomplete tasks của nhóm
                if (
                    isSecretary &&
                    userInfo?.groups &&
                    userInfo.groups.length > 0
                ) {
                    try {
                        const groupId = userInfo.groups[0];
                        const incompleteTasks = await fetchIncompleteTasks(
                            groupId
                        );
                        // Chỉ hiển thị incomplete tasks, không fetch meeting tasks vì chưa có minute
                        setMeetingIssues(
                            Array.isArray(incompleteTasks)
                                ? incompleteTasks
                                : []
                        );
                        setPendingIssues([]); // Reset pending issues khi mở modal mới
                    } catch (error) {
                        console.error("Error loading tasks:", error);
                        setMeetingIssues([]);
                    }
                } else {
                    setMeetingIssues([]);
                }
            }
        } finally {
            setLoadingMinuteModal(false);

            // Bắt đầu auto save mỗi 5 phút (300000 ms) nếu là secretary
            // Auto-save luôn chạy để lưu vào database, không phụ thuộc vào việc đã có biên bản hay chưa
            // Lưu ý: setInterval vẫn chạy khi tab không active, nhưng browser có thể throttle (giảm tốc độ)
            // Để đảm bảo auto-save hoạt động tốt, sẽ auto-save ngay khi tab trở lại active nếu đã bỏ lỡ
            if (isSecretary) {
                lastAutoSaveTimeRef.current = Date.now();

                const interval = setInterval(() => {
                    // Gọi auto save sử dụng ref để đọc state mới nhất
                    // Hàm này sẽ tự động kiểm tra và update nếu đã có biên bản, hoặc create nếu chưa có
                    autoSaveMeetingMinute();
                    lastAutoSaveTimeRef.current = Date.now();
                }, 1 * 60 * 1000); // 5 phút = 300000 ms
                autoSaveIntervalRef.current = interval;

                // Auto-save ngay khi tab trở lại active nếu đã quá 5 phút kể từ lần save cuối
                const handleVisibilityChange = () => {
                    if (!document.hidden && showMinuteModal) {
                        const timeSinceLastSave =
                            Date.now() -
                            (lastAutoSaveTimeRef.current || Date.now());
                        // Nếu đã quá 5 phút kể từ lần save cuối, auto-save ngay
                        if (timeSinceLastSave >= 5 * 60 * 1000) {
                            autoSaveMeetingMinute();
                            lastAutoSaveTimeRef.current = Date.now();
                        }
                    }
                };

                document.addEventListener(
                    "visibilitychange",
                    handleVisibilityChange
                );
                visibilityChangeHandlerRef.current = handleVisibilityChange;

                console.log(
                    "Auto-save interval started: will save every 5 minutes (works even when tab is inactive)"
                );
            }
        }
    };

    // Hàm đóng modal
    const closeMinuteModal = () => {
        // Clear auto save interval
        if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
            autoSaveIntervalRef.current = null;
        }

        // Remove visibility change listener
        if (visibilityChangeHandlerRef.current) {
            document.removeEventListener(
                "visibilitychange",
                visibilityChangeHandlerRef.current
            );
            visibilityChangeHandlerRef.current = null;
        }

        setShowMinuteModal(false);
        setSelectedMeeting(null);
        setMinuteData(null);
        setIsEditing(false);
        setGroupInfo(null);
        setAttendanceList([]);
        setLoadingMinuteModal(false);
        setPendingIssues([]); // Reset pending issues khi đóng modal
        setPreviousMinuteData(null); // Reset biên bản trước đó
        setShowPreviousMinuteModal(false); // Reset previous minute modal
        setPreviousMinuteIssues([]); // Reset previous minute issues
        setLastSaveTime(null);
        setFormData({
            startAt: "",
            endAt: "",
            attendance: "",
            issue: "",
            meetingContent: "",
            other: "",
        });
        setFormErrors({});
    };

    // Hàm xử lý thay đổi attendance
    const handleAttendanceChange = (index, field, value) => {
        setAttendanceList((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            // Nếu đánh dấu là tham gia, xóa lý do
            if (field === "attended" && value === true) {
                updated[index].reason = "";
            }
            return updated;
        });
    };

    // Hàm xử lý thay đổi input
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Xóa lỗi khi user nhập
        if (formErrors[field]) {
            setFormErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.startAt || !formData.startAt.trim()) {
            errors.startAt = "Start time is required";
        }

        if (!formData.endAt || !formData.endAt.trim()) {
            errors.endAt = "End time is required";
        }

        if (!attendanceList || attendanceList.length === 0) {
            errors.attendance = "Attendance list is required";
        } else {
            // Check if absent members have reasons
            const missingReasons = attendanceList.filter(
                (item) => !item.attended && !item.reason.trim()
            );
            if (missingReasons.length > 0) {
                errors.attendance =
                    "Please enter absence reason for absent members";
            }
        }

        if (!formData.meetingContent || !formData.meetingContent.trim()) {
            errors.meetingContent = "Meeting content is required";
        }

        if (
            formData.startAt &&
            formData.endAt &&
            new Date(formData.startAt) >= new Date(formData.endAt)
        ) {
            errors.endAt = "End time must be after start time";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Hàm auto save sử dụng ref để đọc state mới nhất - LUÔN LƯU VÀO DATABASE
    const autoSaveMeetingMinute = async () => {
        const currentFormData = formDataRef.current;
        const currentAttendanceList = attendanceListRef.current;
        const currentSelectedMeeting = selectedMeetingRef.current;
        const currentMinuteData = minuteDataRef.current;
        const currentIsEditing = isEditingRef.current;

        // Kiểm tra có meeting được chọn không
        if (!currentSelectedMeeting) {
            return;
        }

        // Chỉ auto save nếu có dữ liệu đã nhập (ít nhất startAt, endAt, meetingContent)
        if (
            !currentFormData.startAt ||
            !currentFormData.endAt ||
            !currentFormData.meetingContent
        ) {
            return;
        }

        // Format attendance từ attendanceList thành text
        const attendanceText = formatAttendance(currentAttendanceList);

        try {
            let meetingMinuteId;

            // Kiểm tra xem đã có biên bản chưa (qua minuteData hoặc fetch từ API)
            if (currentMinuteData && currentMinuteData.id) {
                // ĐÃ CÓ BIÊN BẢN - UPDATE vào database
                const data = {
                    id: currentMinuteData.id,
                    startAt: new Date(currentFormData.startAt).toISOString(),
                    endAt: new Date(currentFormData.endAt).toISOString(),
                    attendance: attendanceText,
                    issue: "",
                    meetingContent: currentFormData.meetingContent,
                    other: currentFormData.other || "",
                };
                await updateMeetingMinute(data);
                meetingMinuteId = currentMinuteData.id;
                console.log("Auto-saved: Updated meeting minute to database");
            } else {
                // CHƯA CÓ BIÊN BẢN - Tạo mới và lưu vào database
                const data = {
                    meetingDateId: currentSelectedMeeting.id,
                    startAt: new Date(currentFormData.startAt).toISOString(),
                    endAt: new Date(currentFormData.endAt).toISOString(),
                    attendance: attendanceText,
                    issue: "",
                    meetingContent: currentFormData.meetingContent,
                    other: currentFormData.other || "",
                };
                const response = await createMeetingMinute(data);
                meetingMinuteId =
                    response?.data?.id || response?.data?.data?.id;

                // Nếu không có id trong response, fetch lại từ API
                if (!meetingMinuteId) {
                    const meetingMinute = await fetchMeetingMinute(
                        currentSelectedMeeting.id
                    );
                    meetingMinuteId = meetingMinute?.id;

                    // Cập nhật minuteData nếu tìm thấy
                    if (meetingMinute && meetingMinute.id) {
                        minuteDataRef.current = meetingMinute;
                        setMinuteData(meetingMinute);
                        setIsEditing(true);
                    }
                } else {
                    // Cập nhật minuteData sau khi tạo thành công
                    const newMinuteData = await fetchMeetingMinute(
                        currentSelectedMeeting.id
                    );
                    if (newMinuteData) {
                        minuteDataRef.current = newMinuteData;
                        setMinuteData(newMinuteData);
                        setIsEditing(true);
                    }
                }

                // Auto mark isMeeting = true khi tạo biên bản mới
                if (
                    meetingMinuteId &&
                    currentSelectedMeeting &&
                    !currentSelectedMeeting.isMeeting
                ) {
                    try {
                        await client.put(
                            `${API_BASE_URL}/Student/Meeting/update-is-meeting/${currentSelectedMeeting.id}`,
                            true,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                    } catch (error) {
                        console.error(
                            "Error marking meeting as completed:",
                            error
                        );
                    }
                }
                console.log(
                    "Auto-saved: Created new meeting minute in database"
                );
            }

            // Update last save time
            setLastSaveTime(new Date());
        } catch (error) {
            console.error(
                "Error auto saving meeting minute to database:",
                error
            );
        }
    };

    // Hàm lưu biên bản họp (dùng cho cả manual save và auto save)
    const saveMeetingMinute = async (isAutoSave = false) => {
        // Format attendance từ attendanceList thành text trước khi validate
        const attendanceText = formatAttendance(attendanceList);
        setFormData((prev) => ({ ...prev, attendance: attendanceText }));

        // Auto save không cần validate đầy đủ, chỉ cần có dữ liệu cơ bản
        if (!isAutoSave && !validateForm()) {
            return;
        }

        // Nếu auto save và không có dữ liệu gì thì không lưu
        if (
            isAutoSave &&
            (!formData.startAt || !formData.endAt || !formData.meetingContent)
        ) {
            return;
        }

        try {
            let meetingMinuteId;

            if (isEditing && minuteData) {
                // Cập nhật biên bản họp
                const data = {
                    id: minuteData.id,
                    startAt: new Date(formData.startAt).toISOString(),
                    endAt: new Date(formData.endAt).toISOString(),
                    attendance: attendanceText,
                    issue: "",
                    meetingContent: formData.meetingContent,
                    other: formData.other,
                };
                const response = await updateMeetingMinute(data);
                meetingMinuteId = minuteData.id;
                if (!isAutoSave) {
                    alert("Meeting minutes updated successfully!");
                }
            } else {
                // Tạo biên bản họp mới
                const data = {
                    meetingDateId: selectedMeeting.id,
                    startAt: new Date(formData.startAt).toISOString(),
                    endAt: new Date(formData.endAt).toISOString(),
                    attendance: attendanceText,
                    issue: "",
                    meetingContent: formData.meetingContent,
                    other: formData.other,
                };
                const response = await createMeetingMinute(data);
                // Lấy meeting minute id từ response
                meetingMinuteId =
                    response?.data?.id || response?.data?.data?.id;
                if (!meetingMinuteId) {
                    // Nếu không có trong response, fetch lại để lấy id
                    const meetingMinute = await fetchMeetingMinute(
                        selectedMeeting.id
                    );
                    meetingMinuteId = meetingMinute?.id;
                }

                // Auto mark isMeeting = true khi tạo biên bản mới
                if (
                    meetingMinuteId &&
                    selectedMeeting &&
                    !selectedMeeting.isMeeting
                ) {
                    try {
                        await client.put(
                            `${API_BASE_URL}/Student/Meeting/update-is-meeting/${selectedMeeting.id}`,
                            true,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                        // Update local state
                        setMeetings((prevMeetings) =>
                            prevMeetings.map((m) =>
                                m.id === selectedMeeting.id
                                    ? { ...m, isMeeting: true }
                                    : m
                            )
                        );
                        setSelectedMeeting((prev) =>
                            prev ? { ...prev, isMeeting: true } : null
                        );
                    } catch (error) {
                        console.error(
                            "Error marking meeting as completed:",
                            error
                        );
                    }
                }

                if (!isAutoSave) {
                    alert("Meeting minutes created successfully!");
                }
            }

            // Tạo các issue tạm sau khi có meeting minute id (chỉ khi manual save)
            if (!isAutoSave && meetingMinuteId && pendingIssues.length > 0) {
                try {
                    await createPendingIssues(meetingMinuteId);
                    // Refresh danh sách issues sau khi tạo
                    const meetingTasks = await fetchMeetingIssues(
                        meetingMinuteId
                    );
                    setMeetingIssues(
                        Array.isArray(meetingTasks) ? meetingTasks : []
                    );
                } catch (error) {
                    console.error("Error creating pending issues:", error);
                    alert(
                        "Meeting minutes saved but some issues failed to create. Please check again."
                    );
                }
            }

            // Refresh meetings data (chỉ khi manual save)
            if (!isAutoSave && userInfo?.groups && userInfo.groups.length > 0) {
                await fetchMeetings(userInfo.groups[0]);
            }

            // Update last save time
            setLastSaveTime(new Date());

            if (!isAutoSave) {
                closeMinuteModal();
            }
        } catch (error) {
            if (!isAutoSave) {
                alert("Error saving meeting minutes!");
            }
            console.error("Error saving meeting minute:", error);
        }
    };

    // Fetch meeting issues (tasks) by meeting minute id
    const fetchMeetingIssues = async (meetingMinuteId) => {
        try {
            const res = await client.get(
                `${API_BASE_URL}/Student/Task/meeting-tasks/${meetingMinuteId}`
            );
            const data = res.data?.data;
            const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
            const mappedTasks = tasks.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                deadline: t.deadline,
                isActive: t.isActive,
                groupId: t.groupId,
                status: t.status,
                priority: t.priority,
                assigneeId: t.assigneeId,
                assigneeName: t.assigneeName,
            }));
            return mappedTasks;
        } catch (e) {
            return [];
        }
    };

    // Fetch incomplete tasks for the group
    const fetchIncompleteTasks = async (groupId) => {
        if (!groupId) {
            console.error("GroupId is required to fetch incomplete tasks");
            return [];
        }
        try {
            const res = await client.get(
                `${API_BASE_URL}/Student/Task/Incomplete/${groupId}`
            );
            // API trả về { status: 200, message: "...", data: [...] }
            const data = res.data?.data;
            const tasks = Array.isArray(data) ? data : [];
            return tasks.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                deadline: t.deadline,
                isActive: t.isActive,
                groupId: t.groupId,
                status: t.status,
                priority: t.priority,
                assignedTo: t.assignedTo,
                assignedToName: t.assignedToName,
            }));
        } catch (e) {
            console.error("Error fetching incomplete tasks:", e);
            return [];
        }
    };

    const formatDateTime = (dateString) => {
        try {
            // API trả về thời gian đã là múi giờ VN nhưng không có timezone info
            // Nên cần cộng thêm 7 tiếng để hiển thị đúng
            const date = new Date(dateString);
            // Thêm 7 tiếng (7 * 60 * 60 * 1000 ms)
            const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
            return vnDate.toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Todo":
                return "#6b7280";
            case "InProgress":
                return "#3b82f6";
            case "Done":
                return "#10b981";
            case "Review":
                return "#f59e0b";
            default:
                return "#6b7280";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "Todo":
                return "To Do";
            case "InProgress":
                return "In Progress";
            case "Done":
                return "Done";
            case "Review":
                return "In Review";
            default:
                return status || "N/A";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High":
                return "#dc2626";
            case "Medium":
                return "#f59e0b";
            case "Low":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    };

    const meetingIssueColumns = [
        {
            key: "name",
            title: "Issue",
            render: (row) => (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {row.isPending ? (
                        <span>{row.name}</span>
                    ) : (
                        <span
                            onClick={() =>
                                navigate(
                                    `/student/task-detail/${row.groupId}?taskId=${row.id}`
                                )
                            }
                            style={{
                                color: "#3b82f6",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontWeight: 500,
                            }}
                        >
                            {row.name}
                        </span>
                    )}
                    {row.isPending && (
                        <span
                            style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                borderRadius: "4px",
                                fontWeight: "500",
                            }}
                        >
                            Not Saved
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "assignee",
            title: "Assignee",
            render: (row) => (
                <span style={{ fontSize: "12px", color: "#374151" }}>
                    {row.assignedToName ||
                        row.assigneeName ||
                        row.assignedUserId ||
                        "N/A"}
                </span>
            ),
        },
        {
            key: "priority",
            title: "Priority",
            render: (row) => (
                <span
                    style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: getPriorityColor(row.priority) + "20",
                        color: getPriorityColor(row.priority),
                    }}
                >
                    {row.priority || "N/A"}
                </span>
            ),
        },
        {
            key: "isActive",
            title: "Active",
            render: (row) => (
                <span
                    style={{
                        color: row.isActive === true ? "#059669" : "#9ca3af",
                        fontWeight: 500,
                        fontSize: "12px",
                    }}
                >
                    {row.isActive === true ? "✓ Active" : "✗ Inactive"}
                </span>
            ),
        },
        {
            key: "deadline",
            title: "Deadline",
            render: (row) => formatDateTime(row.deadline),
        },
        {
            key: "status",
            title: "Status",
            render: (row) => (
                <span
                    style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: getStatusColor(row.status) + "20",
                        color: getStatusColor(row.status),
                    }}
                >
                    {getStatusText(row.status)}
                </span>
            ),
        },
        {
            key: "actions",
            title: "",
            render: (row) => (
                <div style={{ display: "flex", gap: 4 }}>
                    {row.isPending && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    window.confirm(
                                        "Are you sure you want to delete this issue?"
                                    )
                                ) {
                                    setPendingIssues((prev) =>
                                        prev.filter(
                                            (issue) => issue.id !== row.id
                                        )
                                    );
                                    setMeetingIssues((prev) =>
                                        prev.filter(
                                            (issue) => issue.id !== row.id
                                        )
                                    );
                                }
                            }}
                            style={{
                                background: "#dc2626",
                                color: "#fff",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            ),
        },
    ];

    // Kiểm tra file có đúng định dạng được phép không
    const isValidFileType = (fileName) => {
        if (!fileName) return false;
        const extension = fileName.split(".").pop().toLowerCase();
        const allowedExtensions = [
            // Images
            "jpg",
            "jpeg",
            "png",
            "gif",
            "bmp",
            "webp",
            "svg",
            // PDF
            "pdf",
            // Archives
            "zip",
            "7z",
            "rar",
        ];
        return allowedExtensions.includes(extension);
    };

    const openCreateIssueModal = () => {
        setIssueForm({
            title: "",
            description: "",
            assignee: "",
            priority: "low",
            deadline: "",
            reviewer: "",
        });
        setCreateIssueFiles([]);
        setShowIssueModal(true);
    };

    // Tạo issue: nếu đã có biên bản thì tạo luôn, nếu chưa thì lưu tạm
    const createMeetingIssue = async () => {
        if (!selectedMeeting) return;
        if (!issueForm.title || !issueForm.assignee || !issueForm.deadline) {
            alert("Please fill in title, assignee and deadline");
            return;
        }

        // Validation deadline phải lớn hơn thời gian hiện tại (so sánh ở local time)
        if (issueForm.deadline) {
            const deadlineDate = new Date(issueForm.deadline);
            const currentDate = new Date();
            // Thêm 1 phút buffer để tránh lỗi do sai số thời gian và timezone
            const bufferTime = 60 * 1000; // 1 phút
            if (deadlineDate.getTime() <= currentDate.getTime() + bufferTime) {
                alert("Deadline must be at least 1 minute after current time");
                return;
            }
        }

        // Chuyển đổi datetime-local sang ISO string (giữ nguyên local time, không convert timezone)
        // Format: "YYYY-MM-DDTHH:mm:ss" từ datetime-local input
        const formatDateTimeToISO = (datetimeLocal) => {
            // datetime-local format: "YYYY-MM-DDTHH:mm"
            // Cần convert thành "YYYY-MM-DDTHH:mm:ss" (ISO format nhưng không có timezone)
            if (!datetimeLocal) return "";
            const [datePart, timePart] = datetimeLocal.split("T");
            const [hours, minutes] = timePart.split(":");
            return `${datePart}T${hours}:${minutes}:00`;
        };

        const isoString = formatDateTimeToISO(issueForm.deadline);

        // Nếu đã có biên bản họp (minuteData có id), tạo issue luôn
        if (minuteData && minuteData.id) {
            try {
                const payload = {
                    groupId: userInfo?.groups?.[0],
                    name: issueForm.title,
                    description: issueForm.description || "",
                    taskType: "meeting",
                    endAt: isoString,
                    status: "Todo",
                    priority:
                        issueForm.priority === "high"
                            ? "High"
                            : issueForm.priority === "medium"
                            ? "Medium"
                            : "Low",
                    process: "0",
                    meetingId: minuteData.id, // Sử dụng meeting minute id
                    deliverableId: 0,
                    assignedUserId: parseInt(issueForm.assignee),
                    reviewerId: issueForm.reviewer
                        ? parseInt(issueForm.reviewer)
                        : 0,
                };
                const res = await client.post(
                    `${API_BASE_URL}/Student/Task/create`,
                    payload
                );
                if (res.data?.status === 200) {
                    const createdTaskId = res.data?.data?.id || res.data?.id;

                    // Upload files nếu có
                    if (createdTaskId && createIssueFiles.length > 0) {
                        const semester = groupInfo?.semesterName || "";
                        const groupId = userInfo?.groups?.[0];
                        try {
                            for (const file of createIssueFiles) {
                                await uploadTaskAttachment(
                                    groupId,
                                    createdTaskId,
                                    semester,
                                    file
                                );
                            }
                        } catch (uploadError) {
                            console.error(
                                "Error uploading files:",
                                uploadError
                            );
                            // Không block việc tạo issue nếu upload fail
                        }
                    }

                    setShowIssueModal(false);
                    setIssueForm({
                        title: "",
                        description: "",
                        assignee: "",
                        priority: "low",
                        deadline: "",
                        reviewer: "",
                    });
                    setCreateIssueFiles([]);
                    // Refresh danh sách issues
                    const meetingTasks = await fetchMeetingIssues(
                        minuteData.id
                    );
                    setMeetingIssues(
                        Array.isArray(meetingTasks) ? meetingTasks : []
                    );
                    alert("Issue created successfully!");
                } else {
                    alert(res.data?.message || "Failed to create issue");
                }
            } catch (e) {
                console.error("Error creating meeting issue:", e);
                const errorMessage =
                    e?.response?.data?.message ||
                    e?.message ||
                    "Failed to create issue";
                alert(errorMessage);
            }
        } else {
            // Chưa có biên bản, lưu tạm vào pendingIssues và hiển thị trong bảng
            const pendingIssue = {
                id: `pending_${Date.now()}_${Math.random()}`, // Temporary ID
                name: issueForm.title,
                description: issueForm.description || "",
                deadline: isoString,
                isActive: true,
                groupId: userInfo?.groups?.[0],
                status: "Todo",
                priority:
                    issueForm.priority === "high"
                        ? "High"
                        : issueForm.priority === "medium"
                        ? "Medium"
                        : "Low",
                assignedUserId: parseInt(issueForm.assignee),
                reviewerId: issueForm.reviewer
                    ? parseInt(issueForm.reviewer)
                    : 0,
                isPending: true, // Đánh dấu là issue tạm
            };

            // Lưu files vào pending issue để upload sau khi tạo
            pendingIssue.pendingFiles = createIssueFiles;

            setPendingIssues((prev) => [...prev, pendingIssue]);
            setMeetingIssues((prev) => [...prev, pendingIssue]); // Hiển thị trong bảng
            setShowIssueModal(false);
            setIssueForm({
                title: "",
                description: "",
                assignee: "",
                priority: "low",
                deadline: "",
                reviewer: "",
            });
            setCreateIssueFiles([]);
            alert(
                "Issue added. It will be created when you save the meeting minutes."
            );
        }
    };

    // Tạo các issue thực sự sau khi có meeting minute id
    const createPendingIssues = async (meetingMinuteId) => {
        if (pendingIssues.length === 0) return;

        const createPromises = pendingIssues.map(async (issue) => {
            try {
                const payload = {
                    groupId: issue.groupId,
                    name: issue.name,
                    description: issue.description,
                    taskType: "meeting",
                    endAt: issue.deadline,
                    status: "Todo",
                    priority: issue.priority,
                    process: "0",
                    meetingId: meetingMinuteId, // Sử dụng meeting minute id
                    deliverableId: 0,
                    assignedUserId: issue.assignedUserId,
                    reviewerId: issue.reviewerId || 0,
                };
                const res = await client.post(
                    `${API_BASE_URL}/Student/Task/create`,
                    payload
                );

                // Upload files nếu có
                const createdTaskId = res.data?.data?.id || res.data?.id;
                if (
                    createdTaskId &&
                    issue.pendingFiles &&
                    issue.pendingFiles.length > 0
                ) {
                    const semester = groupInfo?.semesterName || "";
                    for (const file of issue.pendingFiles) {
                        try {
                            await uploadTaskAttachment(
                                issue.groupId,
                                createdTaskId,
                                semester,
                                file
                            );
                        } catch (uploadError) {
                            console.error(
                                "Error uploading file for pending issue:",
                                uploadError
                            );
                        }
                    }
                }
            } catch (e) {
                console.error("Error creating pending issue:", e);
                throw e;
            }
        });

        try {
            await Promise.all(createPromises);
            setPendingIssues([]); // Xóa các issue tạm sau khi tạo thành công
        } catch (error) {
            console.error("Error creating pending issues:", error);
            throw error;
        }
    };

    // Hàm xóa biên bản họp
    const handleDeleteMinute = async () => {
        if (
            !minuteData ||
            !window.confirm(
                "Are you sure you want to delete these meeting minutes?"
            )
        ) {
            return;
        }

        try {
            await deleteMeetingMinute(minuteData.id);

            // Tắt isMeeting của buổi họp khi xóa biên bản
            if (selectedMeeting && selectedMeeting.isMeeting) {
                try {
                    await client.put(
                        `${API_BASE_URL}/Student/Meeting/update-is-meeting/${selectedMeeting.id}`,
                        false,
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    // Update local state
                    setMeetings((prevMeetings) =>
                        prevMeetings.map((m) =>
                            m.id === selectedMeeting.id
                                ? { ...m, isMeeting: false, isMinute: false }
                                : m
                        )
                    );
                    setSelectedMeeting((prev) =>
                        prev
                            ? { ...prev, isMeeting: false, isMinute: false }
                            : null
                    );
                } catch (error) {
                    console.error("Error updating isMeeting status:", error);
                }
            }

            alert("Meeting minutes deleted successfully!");

            // Refresh meetings data
            if (userInfo?.groups && userInfo.groups.length > 0) {
                await fetchMeetings(userInfo.groups[0]);
            }

            closeMinuteModal();
        } catch (error) {
            alert("Error deleting meeting minutes!");
            console.error("Error deleting meeting minute:", error);
        }
    };

    // Hàm tính các ngày trong tuần của meeting (tuần bắt đầu từ thứ 2)
    const getWeekDays = (meetingDate) => {
        const date = new Date(meetingDate);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Tính số ngày cần lùi lại để đến thứ 2 (Monday = 1)
        // Nếu là Chủ nhật (0), lùi 6 ngày; nếu là thứ 2 (1), lùi 0 ngày; ...
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - daysToMonday);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            // Format date string mà không bị ảnh hưởng bởi timezone
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, "0");
            const date = String(day.getDate()).padStart(2, "0");
            const dateString = `${year}-${month}-${date}`;

            days.push({
                date: day,
                dateString: dateString,
                dayName: day.toLocaleDateString("vi-VN", { weekday: "long" }),
                display: day.toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "numeric",
                }),
            });
        }
        return days;
    };

    // Hàm mở modal sửa thời gian
    const openEditScheduleModal = (meeting) => {
        // Cannot edit time if meeting is completed
        if (meeting.isMeeting === true) {
            alert("Cannot edit schedule for completed meetings!");
            return;
        }

        setEditingMeeting(meeting);
        const weekDaysList = getWeekDays(meeting.meetingDate);
        setWeekDays(weekDaysList);

        setScheduleForm({
            meetingDate: meeting.meetingDate.split("T")[0],
            startAt: meeting.startAt || "",
            endAt: meeting.endAt || "",
            description: meeting.description || "",
        });
        setShowEditScheduleModal(true);
    };

    // Hàm đóng modal sửa thời gian
    const closeEditScheduleModal = () => {
        setShowEditScheduleModal(false);
        setEditingMeeting(null);
        setScheduleForm({
            meetingDate: "",
            startAt: "",
            endAt: "",
            description: "",
        });
        setWeekDays([]);
    };

    // Send email notification when meeting schedule is updated
    const sendMeetingScheduleNotification = async (meeting, newSchedule) => {
        try {
            if (!groupInfo?.students || groupInfo.students.length === 0) {
                console.warn("No students to send email");
                return;
            }

            const studentEmails = groupInfo.students
                .filter((s) => s.email)
                .map((s) => s.email);

            if (studentEmails.length === 0) {
                console.warn("No valid email addresses found");
                return;
            }

            const updaterName = userInfo?.name || "Secretary";
            const projectName = groupInfo?.projectName || "Your Project";
            const newDate = new Date(newSchedule.meetingDate);
            const formattedDate = newDate.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            const emailBody = baseTemplate({
                title: "Meeting Schedule Updated",
                greeting: `Dear ${projectName} Team,`,
                content: `The meeting schedule has been updated. Please check the new schedule below.`,
                infoItems: [
                    { label: "Meeting", value: newSchedule.description },
                    { label: "New Date", value: formattedDate },
                    {
                        label: "Time",
                        value: `${newSchedule.startAt} - ${newSchedule.endAt}`,
                    },
                    { label: "Updated by", value: updaterName },
                ],
                footerNote:
                    "Please make sure to attend the meeting at the new scheduled time.",
            });

            await sendEmail({
                to: studentEmails,
                subject: `[Capstone] Meeting Schedule Updated - ${newSchedule.description}`,
                body: emailBody,
            });
        } catch (error) {
            console.error("Error sending email notification:", error);
        }
    };

    // Hàm cập nhật thời gian meeting
    const updateMeetingSchedule = async () => {
        if (!editingMeeting) return;

        if (
            !scheduleForm.meetingDate ||
            !scheduleForm.startAt ||
            !scheduleForm.endAt ||
            !scheduleForm.description.trim()
        ) {
            alert("Please fill in all required fields");
            return;
        }

        if (scheduleForm.startAt >= scheduleForm.endAt) {
            alert("End time must be after start time");
            return;
        }

        try {
            // Format meetingDate mà không bị ảnh hưởng bởi timezone
            // scheduleForm.meetingDate format: "YYYY-MM-DD"
            // Cần convert thành "YYYY-MM-DDTHH:mm:ss" (ISO format nhưng không có timezone)
            const formatDateToISO = (dateString) => {
                if (!dateString) return "";
                // dateString format: "YYYY-MM-DD"
                // Thêm "T00:00:00" để tạo ISO format
                return `${dateString}T00:00:00`;
            };

            const payload = {
                meetingDate: formatDateToISO(scheduleForm.meetingDate),
                startAt: scheduleForm.startAt,
                endAt: scheduleForm.endAt,
                description: scheduleForm.description.trim(),
            };

            const response = await client.put(
                `${API_BASE_URL}/Student/Meeting/schedule/${editingMeeting.id}`,
                payload
            );

            if (response.data.status === 200) {
                // Send email notification to group members
                if (groupInfo) {
                    await sendMeetingScheduleNotification(
                        editingMeeting,
                        scheduleForm
                    );
                } else if (userInfo?.groups && userInfo.groups.length > 0) {
                    // Fetch group info if not available
                    const fetchedGroupInfo = await fetchGroupInfo(
                        userInfo.groups[0]
                    );
                    if (fetchedGroupInfo) {
                        setGroupInfo(fetchedGroupInfo);
                        await sendMeetingScheduleNotification(
                            editingMeeting,
                            scheduleForm
                        );
                    }
                }

                alert("Meeting schedule updated successfully!");
                closeEditScheduleModal();

                // Refresh meetings data
                if (userInfo?.groups && userInfo.groups.length > 0) {
                    await fetchMeetings(userInfo.groups[0]);
                }
            } else {
                alert(response.data.message || "Update failed");
            }
        } catch (error) {
            console.error("Error updating meeting schedule:", error);
            alert("Error updating meeting schedule!");
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Loading data...</div>
            </div>
        );
    }

    // Display message if no meetings
    if (!loading && meetings.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Meeting Management</h1>
                    <p>Manage group meetings</p>
                    {userInfo && (
                        <div className={styles.userInfo}>
                            <p>
                                <strong>User:</strong> {userInfo.name}
                            </p>
                            <p>
                                <strong>Role:</strong>{" "}
                                {userInfo.roleInGroup || userInfo.role}
                            </p>
                        </div>
                    )}
                </div>
                <div className={styles.noData}>
                    <h3>No meetings found</h3>
                    <p>There are no meetings scheduled for your group yet.</p>
                    {!userInfo && (
                        <div style={{ color: "red", marginTop: "10px" }}>
                            <p>
                                <strong>Error:</strong> Unable to get user
                                information. Please check:
                            </p>
                            <ul
                                style={{
                                    textAlign: "left",
                                    display: "inline-block",
                                }}
                            >
                                <li>Are you logged in?</li>
                                <li>Is the token valid?</li>
                                <li>Is the API working?</li>
                            </ul>
                            <Button
                                onClick={() => {
                                    setLoading(true);
                                    fetchUserInfo();
                                }}
                                style={{ marginTop: "10px" }}
                            >
                                Retry
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div
                className={styles.header}
                style={{
                    background: "white",
                    padding: isMobile ? "16px" : "24px",
                    borderRadius: "8px",
                    marginBottom: isMobile ? "12px" : "20px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? "16px" : "20px",
                }}
            >
                {/* Text content */}
                <div>
                    <h1
                        style={{
                            margin: "0 0 8px 0",
                            fontSize: isMobile ? "18px" : "24px",
                            fontWeight: "600",
                            color: "#1f2937",
                        }}
                    >
                        Meeting Management
                    </h1>
                    <p
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: isMobile ? "12px" : "14px",
                            color: "#6b7280",
                        }}
                    >
                        Manage group meetings
                    </p>

                    {userInfo && (
                        <div
                            className={styles.userInfo}
                            style={{
                                display: "flex",
                                gap: isMobile ? "8px" : "16px",
                                flexWrap: "wrap",
                                flexDirection: isMobile ? "column" : "row",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: isMobile ? "12px" : "14px",
                                    color: "#374151",
                                }}
                            >
                                <strong>User:</strong> {userInfo.name}
                            </span>
                            <span
                                style={{
                                    fontSize: isMobile ? "12px" : "14px",
                                    color: "#374151",
                                }}
                            >
                                <strong>Role:</strong>{" "}
                                {userInfo.roleInGroup || userInfo.role}
                            </span>
                        </div>
                    )}
                </div>

                {/* Statistics section */}
                {userInfo &&
                    meetings.length > 0 &&
                    (() => {
                        const now = new Date();
                        let totalMeetings = meetings.length;
                        let attendedCount = 0;
                        let absentCount = 0;
                        let upcomingCount = 0;

                        meetings.forEach((meeting) => {
                            const meetingDate = new Date(meeting.meetingDate);
                            const hasHappened =
                                meeting.isMeeting === true &&
                                meetingDate <= now;
                            // console.log(meeting);
                            if (!hasHappened) {
                                // Chưa diễn ra
                                upcomingCount++;
                            } else {
                                // Đã diễn ra, kiểm tra attendance
                                const attendanceStatus =
                                    getUserAttendanceStatus(meeting);
                                if (attendanceStatus === "Attended") {
                                    attendedCount++;
                                } else if (attendanceStatus === "Absent") {
                                    absentCount++;
                                }
                            }
                        });

                        return (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    width: "100%",
                                    flexWrap: "wrap",
                                    gap: isMobile ? "12px" : "24px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "11px"
                                                : "13px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Total:
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "16px"
                                                : "20px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                        }}
                                    >
                                        {totalMeetings}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "11px"
                                                : "13px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Attended:
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "16px"
                                                : "20px",
                                            fontWeight: "600",
                                            color: "#10b981",
                                        }}
                                    >
                                        {attendedCount}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "11px"
                                                : "13px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Absent:
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "16px"
                                                : "20px",
                                            fontWeight: "600",
                                            color: "#dc2626",
                                        }}
                                    >
                                        {absentCount}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "11px"
                                                : "13px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Upcoming:
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isMobile
                                                ? "16px"
                                                : "20px",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                        }}
                                    >
                                        {upcomingCount}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
            </div>

            {/* Meetings Table */}
            <div
                style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    overflow: isMobile ? "auto" : "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    width: "100%",
                }}
            >
                <DataTable
                    columns={(() => {
                        const allColumns = [
                            {
                                key: "description",
                                title: "Meeting",
                                render: (row) => {
                                    const hasMinute = row.isMinute === true;
                                    return (
                                        <div>
                                            {hasMinute ? (
                                                <span
                                                    onClick={() =>
                                                        openMinuteModal(row)
                                                    }
                                                    style={{
                                                        color: "#3b82f6",
                                                        cursor: "pointer",
                                                        textDecoration:
                                                            "underline",
                                                        fontWeight: 500,
                                                        fontSize: isMobile
                                                            ? "12px"
                                                            : "14px",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {row.description}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontWeight: 500,
                                                        color: "#1f2937",
                                                        fontSize: isMobile
                                                            ? "12px"
                                                            : "14px",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {row.description}
                                                </span>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                key: "meetingDate",
                                title: "Date",
                                render: (row) => {
                                    const date = new Date(row.meetingDate);
                                    return (
                                        <span
                                            style={{
                                                fontSize: isMobile
                                                    ? "11px"
                                                    : "13px",
                                                whiteSpace: isMobile
                                                    ? "nowrap"
                                                    : "normal",
                                            }}
                                        >
                                            {isMobile
                                                ? date.toLocaleDateString(
                                                      "vi-VN",
                                                      {
                                                          day: "2-digit",
                                                          month: "2-digit",
                                                      }
                                                  )
                                                : date.toLocaleDateString(
                                                      "vi-VN",
                                                      {
                                                          weekday: "short",
                                                          day: "2-digit",
                                                          month: "2-digit",
                                                          year: "numeric",
                                                      }
                                                  )}
                                        </span>
                                    );
                                },
                                hidden: isMobile && window.innerWidth < 640,
                            },
                            {
                                key: "time",
                                title: "Time",
                                render: (row) => {
                                    const formatTime = (timeString) => {
                                        if (!timeString) return "";
                                        const parts = timeString.split(":");
                                        return `${parts[0]}:${parts[1]}`;
                                    };
                                    const startTime = formatTime(row.startAt);
                                    const endTime = formatTime(row.endAt);
                                    return (
                                        <span
                                            style={{
                                                fontSize: isMobile
                                                    ? "11px"
                                                    : "13px",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {startTime && endTime
                                                ? `${startTime} - ${endTime}`
                                                : row.time || "N/A"}
                                        </span>
                                    );
                                },
                            },
                            {
                                key: "status",
                                title: "Status",
                                render: (row) => {
                                    const status = getMeetingStatus(row);
                                    return (
                                        <span
                                            style={{
                                                backgroundColor:
                                                    row.isMeeting === true
                                                        ? "#10b981"
                                                        : status === "Upcoming"
                                                        ? "#f59e0b"
                                                        : "#6b7280",
                                                color: "white",
                                                padding: isMobile
                                                    ? "2px 6px"
                                                    : "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: isMobile
                                                    ? "9px"
                                                    : "11px",
                                                fontWeight: "600",
                                                textTransform: "uppercase",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {getMeetingStatusText(status)}
                                        </span>
                                    );
                                },
                            },
                            {
                                key: "isMinute",
                                title: "Minutes",
                                render: (row) => (
                                    <span
                                        style={{
                                            color:
                                                row.isMinute === true
                                                    ? "#059669"
                                                    : "#9ca3af",
                                            fontWeight: 500,
                                            fontSize: isMobile
                                                ? "10px"
                                                : "12px",
                                        }}
                                    >
                                        {row.isMinute === true
                                            ? isMobile
                                                ? "✓"
                                                : "✓ Available"
                                            : isMobile
                                            ? "✗"
                                            : "✗ Not Available"}
                                    </span>
                                ),
                                hidden: isMobile && window.innerWidth < 640,
                            },
                            {
                                key: "attendance",
                                title: "Attendance",
                                render: (row) => {
                                    const attendanceStatus =
                                        getUserAttendanceStatus(row);
                                    return (
                                        <span
                                            style={{
                                                color:
                                                    attendanceStatus ===
                                                    "Attended"
                                                        ? "#059669"
                                                        : attendanceStatus ===
                                                          "Absent"
                                                        ? "#dc2626"
                                                        : "#6b7280",
                                                fontWeight: 500,
                                                fontSize: isMobile
                                                    ? "10px"
                                                    : "12px",
                                            }}
                                        >
                                            {attendanceStatus}
                                        </span>
                                    );
                                },
                            },
                            {
                                key: "actions",
                                title: "Actions",
                                render: (row) => {
                                    const isMeetingCompleted =
                                        row.isMeeting === true;
                                    const hasMinute = row.isMinute === true;

                                    return (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: isMobile ? "4px" : "6px",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {/* Nút tham gia họp - chỉ hiển thị khi chưa họp */}
                                            {!isMeetingCompleted && (
                                                <Button
                                                    onClick={() =>
                                                        joinMeeting(
                                                            row.meetingLink
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#3b82f6",
                                                        color: "white",
                                                        border: "none",
                                                        padding: isMobile
                                                            ? "3px 8px"
                                                            : "4px 10px",
                                                        borderRadius: "4px",
                                                        fontSize: isMobile
                                                            ? "10px"
                                                            : "12px",
                                                        fontWeight: "500",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {isMobile ? "Join" : "Join"}
                                                </Button>
                                            )}

                                            {/* Nút sửa thời gian - chỉ cho Secretary và chưa họp */}
                                            {isSecretary &&
                                                !isMeetingCompleted && (
                                                    <Button
                                                        onClick={() =>
                                                            openEditScheduleModal(
                                                                row
                                                            )
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                "#8b5cf6",
                                                            color: "white",
                                                            border: "none",
                                                            padding: isMobile
                                                                ? "3px 8px"
                                                                : "4px 10px",
                                                            borderRadius: "4px",
                                                            fontSize: isMobile
                                                                ? "10px"
                                                                : "12px",
                                                            fontWeight: "500",
                                                            cursor: "pointer",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {isMobile
                                                            ? "Edit"
                                                            : "Edit Time"}
                                                    </Button>
                                                )}

                                            {/* Nút tạo biên bản - chỉ cho Secretary và chưa có biên bản (có thể tạo trước khi họp) */}
                                            {isSecretary && !hasMinute && (
                                                <Button
                                                    onClick={() =>
                                                        openMinuteModal(row)
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#f59e0b",
                                                        color: "white",
                                                        border: "none",
                                                        padding: isMobile
                                                            ? "3px 8px"
                                                            : "4px 10px",
                                                        borderRadius: "4px",
                                                        fontSize: isMobile
                                                            ? "10px"
                                                            : "12px",
                                                        fontWeight: "500",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {isMobile
                                                        ? "Create"
                                                        : "Create Minutes"}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                },
                            },
                        ];
                        // Filter out hidden columns
                        return allColumns.filter((col) => !col.hidden);
                    })()}
                    data={meetings.slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE
                    )}
                    loading={loading}
                    emptyMessage="No meetings available"
                    showIndex={true}
                    indexTitle="STT"
                    indexOffset={(currentPage - 1) * ITEMS_PER_PAGE}
                />

                {/* Pagination */}
                {meetings.length > ITEMS_PER_PAGE && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: isMobile ? "4px" : "8px",
                            padding: isMobile ? "12px 8px" : "16px",
                            borderTop: "1px solid #e5e7eb",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            style={{
                                padding: isMobile ? "4px 8px" : "6px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                background:
                                    currentPage === 1 ? "#f3f4f6" : "white",
                                color:
                                    currentPage === 1 ? "#9ca3af" : "#374151",
                                cursor:
                                    currentPage === 1
                                        ? "not-allowed"
                                        : "pointer",
                                fontSize: isMobile ? "11px" : "13px",
                            }}
                        >
                            {isMobile ? "←" : "← Previous"}
                        </button>

                        {Array.from(
                            {
                                length: Math.ceil(
                                    meetings.length / ITEMS_PER_PAGE
                                ),
                            },
                            (_, i) => i + 1
                        )
                            .filter((page) => {
                                // Trên mobile chỉ hiển thị 3 trang gần current page
                                if (isMobile) {
                                    return (
                                        Math.abs(page - currentPage) <= 1 ||
                                        page === 1 ||
                                        page ===
                                            Math.ceil(
                                                meetings.length / ITEMS_PER_PAGE
                                            )
                                    );
                                }
                                return true;
                            })
                            .map((page, idx, arr) => {
                                // Thêm ellipsis nếu có khoảng trống
                                const showEllipsisBefore =
                                    idx > 0 && page - arr[idx - 1] > 1;
                                return (
                                    <React.Fragment key={page}>
                                        {showEllipsisBefore && (
                                            <span
                                                style={{
                                                    padding: "0 4px",
                                                    fontSize: isMobile
                                                        ? "11px"
                                                        : "13px",
                                                    color: "#6b7280",
                                                }}
                                            >
                                                ...
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            style={{
                                                padding: isMobile
                                                    ? "4px 8px"
                                                    : "6px 12px",
                                                border: "1px solid",
                                                borderColor:
                                                    currentPage === page
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                                borderRadius: "4px",
                                                background:
                                                    currentPage === page
                                                        ? "#3b82f6"
                                                        : "white",
                                                color:
                                                    currentPage === page
                                                        ? "white"
                                                        : "#374151",
                                                cursor: "pointer",
                                                fontSize: isMobile
                                                    ? "11px"
                                                    : "13px",
                                                fontWeight:
                                                    currentPage === page
                                                        ? "600"
                                                        : "400",
                                                minWidth: isMobile
                                                    ? "28px"
                                                    : "36px",
                                            }}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                );
                            })}

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(
                                        Math.ceil(
                                            meetings.length / ITEMS_PER_PAGE
                                        ),
                                        prev + 1
                                    )
                                )
                            }
                            disabled={
                                currentPage ===
                                Math.ceil(meetings.length / ITEMS_PER_PAGE)
                            }
                            style={{
                                padding: isMobile ? "4px 8px" : "6px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                background:
                                    currentPage ===
                                    Math.ceil(meetings.length / ITEMS_PER_PAGE)
                                        ? "#f3f4f6"
                                        : "white",
                                color:
                                    currentPage ===
                                    Math.ceil(meetings.length / ITEMS_PER_PAGE)
                                        ? "#9ca3af"
                                        : "#374151",
                                cursor:
                                    currentPage ===
                                    Math.ceil(meetings.length / ITEMS_PER_PAGE)
                                        ? "not-allowed"
                                        : "pointer",
                                fontSize: isMobile ? "11px" : "13px",
                            }}
                        >
                            {isMobile ? "→" : "Next →"}
                        </button>

                        {!isMobile && (
                            <span
                                style={{
                                    marginLeft: "12px",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                }}
                            >
                                Page {currentPage} of{" "}
                                {Math.ceil(meetings.length / ITEMS_PER_PAGE)} (
                                {meetings.length} meetings)
                            </span>
                        )}
                        {isMobile && (
                            <span
                                style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                    color: "#6b7280",
                                    width: "100%",
                                    textAlign: "center",
                                    marginTop: "8px",
                                }}
                            >
                                {currentPage}/
                                {Math.ceil(meetings.length / ITEMS_PER_PAGE)} (
                                {meetings.length} meetings)
                            </span>
                        )}
                    </div>
                )}
            </div>

            {showMinuteModal && selectedMeeting && (
                <div
                    className={styles.modalOverlay}
                    onClick={closeMinuteModal}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: showPreviousMinuteModal
                            ? "flex-end"
                            : "center",
                        padding: showPreviousMinuteModal ? "20px" : "0",
                    }}
                >
                    <div
                        className={styles.minuteModal}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: isMobile ? "16px" : "24px",
                            maxWidth: isMobile
                                ? "95%"
                                : showPreviousMinuteModal
                                ? "55%"
                                : "1000px",
                            width: isMobile
                                ? "95%"
                                : showPreviousMinuteModal
                                ? "55%"
                                : "90%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            transition: "all 0.3s ease",
                            marginRight:
                                showPreviousMinuteModal && !isMobile
                                    ? "20px"
                                    : "0",
                        }}
                    >
                        <div className={styles.modalHeader}>
                            <h3>
                                {isEditing
                                    ? "Edit Meeting Minutes"
                                    : "Create Meeting Minutes"}{" "}
                                - {selectedMeeting.description}
                            </h3>
                            {minuteData && (
                                <div className={styles.minuteInfo}>
                                    <p>
                                        <strong>Created by:</strong>{" "}
                                        {minuteData.createBy}
                                    </p>
                                    <p>
                                        <strong>Created at:</strong>{" "}
                                        {formatDateTime(minuteData.createAt)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {loadingMinuteModal ? (
                            <div
                                style={{
                                    padding: "40px",
                                    textAlign: "center",
                                    color: "#6b7280",
                                }}
                            >
                                <div>Loading data...</div>
                            </div>
                        ) : (
                            <div className={styles.modalBody}>
                                {/* Link to view previous meeting minutes (only when creating new) */}
                                {!isEditing && previousMinuteData && (
                                    <div
                                        style={{
                                            background: "#f0f9ff",
                                            border: "1px solid #0ea5e9",
                                            borderRadius: 8,
                                            padding: 12,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ fontSize: 16 }}>
                                                📋
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    color: "#0c4a6e",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Previous meeting minutes
                                                available
                                            </span>
                                        </div>
                                        <a
                                            href="#"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                setShowPreviousMinuteModal(
                                                    true
                                                );
                                                // Load issues for previous minute
                                                if (previousMinuteData?.id) {
                                                    try {
                                                        const issues =
                                                            await fetchMeetingIssues(
                                                                previousMinuteData.id
                                                            );
                                                        setPreviousMinuteIssues(
                                                            Array.isArray(
                                                                issues
                                                            )
                                                                ? issues
                                                                : []
                                                        );
                                                    } catch (e) {
                                                        setPreviousMinuteIssues(
                                                            []
                                                        );
                                                    }
                                                }
                                            }}
                                            style={{
                                                color: "#0ea5e9",
                                                textDecoration: "underline",
                                                fontSize: 13,
                                                fontWeight: 500,
                                                cursor: "pointer",
                                            }}
                                        >
                                            View Previous Minutes →
                                        </a>
                                    </div>
                                )}

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>
                                            Start Time{" "}
                                            {isSecretary &&
                                                canEditMinute() &&
                                                "*"}
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.startAt}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "startAt",
                                                    e.target.value
                                                )
                                            }
                                            error={formErrors.startAt}
                                            disabled={
                                                !isSecretary || !canEditMinute()
                                            }
                                            style={
                                                !isSecretary || !canEditMinute()
                                                    ? {
                                                          backgroundColor:
                                                              "#f3f4f6",
                                                      }
                                                    : {}
                                            }
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>
                                            End Time{" "}
                                            {isSecretary &&
                                                canEditMinute() &&
                                                "*"}
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.endAt}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "endAt",
                                                    e.target.value
                                                )
                                            }
                                            error={formErrors.endAt}
                                            disabled={
                                                !isSecretary || !canEditMinute()
                                            }
                                            style={
                                                !isSecretary || !canEditMinute()
                                                    ? {
                                                          backgroundColor:
                                                              "#f3f4f6",
                                                      }
                                                    : {}
                                            }
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>
                                        Attendance List{" "}
                                        {isSecretary && canEditMinute() && "*"}
                                    </label>
                                    {/* View mode (cannot edit OR not secretary) - show as read-only input */}
                                    {!canEditMinute() || !isSecretary ? (
                                        <div
                                            style={{
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                padding: "12px",
                                                backgroundColor: "#f3f4f6",
                                                fontSize: "13px",
                                                color: "#374151",
                                                minHeight: "60px",
                                            }}
                                        >
                                            {attendanceList.length > 0 ? (
                                                (() => {
                                                    const attended =
                                                        attendanceList.filter(
                                                            (item) =>
                                                                item.attended
                                                        );
                                                    const absent =
                                                        attendanceList.filter(
                                                            (item) =>
                                                                !item.attended
                                                        );

                                                    if (absent.length === 0) {
                                                        return (
                                                            <div
                                                                style={{
                                                                    color: "#059669",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                ✓ All members
                                                                attended (
                                                                {
                                                                    attendanceList.length
                                                                }{" "}
                                                                members):{" "}
                                                                {attended
                                                                    .map(
                                                                        (m) =>
                                                                            m.name
                                                                    )
                                                                    .join(", ")}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        marginBottom: 8,
                                                                    }}
                                                                >
                                                                    <strong
                                                                        style={{
                                                                            color: "#059669",
                                                                        }}
                                                                    >
                                                                        ✓
                                                                        Attended
                                                                        (
                                                                        {
                                                                            attended.length
                                                                        }
                                                                        ):
                                                                    </strong>{" "}
                                                                    {attended
                                                                        .map(
                                                                            (
                                                                                m
                                                                            ) =>
                                                                                m.name
                                                                        )
                                                                        .join(
                                                                            ", "
                                                                        ) ||
                                                                        "None"}
                                                                </div>
                                                                <div>
                                                                    <strong
                                                                        style={{
                                                                            color: "#dc2626",
                                                                        }}
                                                                    >
                                                                        ✗ Absent
                                                                        (
                                                                        {
                                                                            absent.length
                                                                        }
                                                                        ):
                                                                    </strong>{" "}
                                                                    {absent
                                                                        .map(
                                                                            (
                                                                                m
                                                                            ) =>
                                                                                `${
                                                                                    m.name
                                                                                } (${
                                                                                    m.reason ||
                                                                                    "No reason"
                                                                                })`
                                                                        )
                                                                        .join(
                                                                            "; "
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                <span
                                                    style={{
                                                        color: "#9ca3af",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    No attendance data
                                                </span>
                                            )}
                                        </div>
                                    ) : attendanceList.length > 0 ? (
                                        <div
                                            style={{
                                                border: `1px solid ${
                                                    formErrors.attendance
                                                        ? "#dc2626"
                                                        : "#d1d5db"
                                                }`,
                                                borderRadius: "6px",
                                                padding: "8px",
                                                backgroundColor: "#f9fafb",
                                            }}
                                        >
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse: "collapse",
                                                }}
                                            >
                                                <thead>
                                                    <tr
                                                        style={{
                                                            borderBottom:
                                                                "1px solid #e5e7eb",
                                                        }}
                                                    >
                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "6px 8px",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#374151",
                                                            }}
                                                        >
                                                            Member
                                                        </th>
                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                                padding:
                                                                    "6px 8px",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#374151",
                                                                width: "100px",
                                                            }}
                                                        >
                                                            Attended
                                                        </th>
                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "6px 8px",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#374151",
                                                            }}
                                                        >
                                                            Absence Reason
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceList.map(
                                                        (item, index) => (
                                                            <tr
                                                                key={
                                                                    item.studentId
                                                                }
                                                                style={{
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "6px 8px",
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "13px",
                                                                            fontWeight:
                                                                                "500",
                                                                            color: "#1f2937",
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "11px",
                                                                            color: "#6b7280",
                                                                            marginTop:
                                                                                "1px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.rollNumber
                                                                        }{" "}
                                                                        {item.role &&
                                                                            `- ${item.role}`}
                                                                    </div>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "6px 8px",
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            item.attended
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleAttendanceChange(
                                                                                index,
                                                                                "attended",
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: "18px",
                                                                            height: "18px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "6px 8px",
                                                                    }}
                                                                >
                                                                    <Input
                                                                        type="text"
                                                                        value={
                                                                            item.reason
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleAttendanceChange(
                                                                                index,
                                                                                "reason",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder={
                                                                            item.attended
                                                                                ? "Reason (optional)"
                                                                                : "Enter absence reason..."
                                                                        }
                                                                        disabled={
                                                                            item.attended
                                                                        }
                                                                        style={{
                                                                            fontSize:
                                                                                "12px",
                                                                            padding:
                                                                                "4px 8px",
                                                                            width: "100%",
                                                                            backgroundColor:
                                                                                item.attended
                                                                                    ? "#f3f4f6"
                                                                                    : "white",
                                                                        }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                                color: "#6b7280",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Loading member list...
                                        </div>
                                    )}
                                    {formErrors.attendance &&
                                        isSecretary &&
                                        canEditMinute() && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "12px",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                {formErrors.attendance}
                                            </div>
                                        )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>
                                        Meeting Content{" "}
                                        {isSecretary && canEditMinute() && "*"}
                                    </label>
                                    <Textarea
                                        ref={meetingContentRef}
                                        value={formData.meetingContent}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "meetingContent",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Record the content presented in the meeting..."
                                        rows={6}
                                        style={{
                                            ...(formErrors.meetingContent
                                                ? { borderColor: "#dc2626" }
                                                : {}),
                                            ...(!isSecretary || !canEditMinute()
                                                ? { backgroundColor: "#f3f4f6" }
                                                : {}),
                                        }}
                                        disabled={
                                            !isSecretary || !canEditMinute()
                                        }
                                    />
                                    {formErrors.meetingContent &&
                                        isSecretary &&
                                        canEditMinute() && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "12px",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                {formErrors.meetingContent}
                                            </div>
                                        )}
                                </div>

                                <div className={styles.formGroup}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <label style={{ margin: 0 }}>
                                            Issues
                                        </label>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            maxWidth: "100%",
                                            overflowX: "hidden",
                                        }}
                                    >
                                        <DataTable
                                            columns={meetingIssueColumns}
                                            data={meetingIssues}
                                            loading={loading}
                                            emptyMessage="No issues yet"
                                            className={
                                                styles.compactTable || ""
                                            }
                                        />
                                    </div>
                                    {/* Nút Add Issue xuống dưới bảng */}
                                    {isSecretary && canEditMinute() && (
                                        <div
                                            style={{
                                                marginTop: 12,
                                                display: "flex",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <button
                                                onClick={openCreateIssueModal}
                                                style={{
                                                    background: "#10B981",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Add Issue
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Other Notes</label>
                                    <Textarea
                                        value={formData.other}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "other",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Any other notes from the meeting..."
                                        rows={3}
                                        disabled={
                                            !isSecretary || !canEditMinute()
                                        }
                                        style={
                                            !isSecretary || !canEditMinute()
                                                ? { backgroundColor: "#f3f4f6" }
                                                : {}
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {!loadingMinuteModal && (
                            <div className={styles.modalFooter}>
                                {/* Cho phép tạo biên bản bất cứ lúc nào, nhưng chỉ cho phép sửa biên bản đã có trong ngày họp */}
                                {isSecretary && canEditMinute() && (
                                    <>
                                        {isEditing && minuteData && (
                                            <Button
                                                variant="danger"
                                                onClick={handleDeleteMinute}
                                                className={styles.deleteButton}
                                            >
                                                Delete Minutes
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() =>
                                                saveMeetingMinute(false)
                                            }
                                            className={styles.saveButton}
                                        >
                                            {isEditing ? "Update" : "Save"}
                                        </Button>
                                    </>
                                )}
                                {/* Display message if cannot edit (only when editing existing minutes) */}
                                {!canEditMinute() &&
                                    isSecretary &&
                                    isEditing &&
                                    minuteData && (
                                        <span
                                            style={{
                                                color: "#6b7280",
                                                fontSize: "13px",
                                                marginRight: "auto",
                                            }}
                                        >
                                            Can only edit minutes on the meeting
                                            day
                                        </span>
                                    )}
                                {lastSaveTime && (
                                    <span
                                        style={{
                                            color: "#6b7280",
                                            fontSize: "12px",
                                            marginRight: "auto",
                                        }}
                                    >
                                        Last auto-saved:{" "}
                                        {lastSaveTime.toLocaleTimeString(
                                            "vi-VN"
                                        )}
                                    </span>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={closeMinuteModal}
                                >
                                    {isSecretary && canEditMinute()
                                        ? "Cancel"
                                        : "Close"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showIssueModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowIssueModal(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: isMobile ? "10px" : "20px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={styles.taskModal}
                        style={{
                            maxWidth: isMobile ? "95%" : "600px",
                            width: isMobile ? "95%" : "90%",
                            maxHeight: isMobile ? "90vh" : "auto",
                            overflow: "auto",
                        }}
                    >
                        <h3>Create Meeting Issue</h3>
                        <div className={styles.formGroup}>
                            <label>
                                Title <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={styles.input}
                                type="text"
                                value={issueForm.title}
                                onChange={(e) =>
                                    setIssueForm({
                                        ...issueForm,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Enter issue title"
                                maxLength={100}
                            />
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    marginTop: "4px",
                                    textAlign: "right",
                                }}
                            >
                                {issueForm.title.length}/100 characters
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={issueForm.description}
                                onChange={(e) =>
                                    setIssueForm({
                                        ...issueForm,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Short description"
                            />
                        </div>
                        <div className={styles.taskFormRow}>
                            <div className={styles.formGroup}>
                                <label>
                                    Assignee{" "}
                                    <span className={styles.required}>*</span>
                                </label>
                                <select
                                    className={styles.select}
                                    value={issueForm.assignee}
                                    onChange={(e) =>
                                        setIssueForm({
                                            ...issueForm,
                                            assignee: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select assignee</option>
                                    {assigneeOptions.map((a) => (
                                        <option key={a.value} value={a.value}>
                                            {a.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Reviewer</label>
                                <select
                                    className={styles.select}
                                    value={issueForm.reviewer}
                                    onChange={(e) =>
                                        setIssueForm({
                                            ...issueForm,
                                            reviewer: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">
                                        Select reviewer (optional)
                                    </option>
                                    {reviewerOptions.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select
                                    className={styles.select}
                                    value={issueForm.priority}
                                    onChange={(e) =>
                                        setIssueForm({
                                            ...issueForm,
                                            priority: e.target.value,
                                        })
                                    }
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>
                                Deadline{" "}
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={styles.input}
                                type="datetime-local"
                                value={issueForm.deadline}
                                onChange={(e) =>
                                    setIssueForm({
                                        ...issueForm,
                                        deadline: e.target.value,
                                    })
                                }
                                min={(() => {
                                    // Set min là thời gian hiện tại + 1 phút
                                    const now = new Date();
                                    now.setMinutes(now.getMinutes() + 1);
                                    const year = now.getFullYear();
                                    const month = String(
                                        now.getMonth() + 1
                                    ).padStart(2, "0");
                                    const day = String(now.getDate()).padStart(
                                        2,
                                        "0"
                                    );
                                    const hours = String(
                                        now.getHours()
                                    ).padStart(2, "0");
                                    const minutes = String(
                                        now.getMinutes()
                                    ).padStart(2, "0");
                                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                                })()}
                            />
                        </div>

                        {/* File Attachment Section */}
                        <div className={styles.formGroup}>
                            <label>Attachments</label>
                            <div className={styles.fileUploadSection}>
                                <input
                                    type="file"
                                    id="create-issue-file-input"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.zip,.7z,.rar"
                                    onChange={(e) => {
                                        const files = Array.from(
                                            e.target.files
                                        );
                                        const validFiles = [];
                                        const invalidFiles = [];

                                        files.forEach((file) => {
                                            if (isValidFileType(file.name)) {
                                                validFiles.push(file);
                                            } else {
                                                invalidFiles.push(file.name);
                                            }
                                        });

                                        if (invalidFiles.length > 0) {
                                            alert(
                                                `Invalid file type: ${invalidFiles.join(
                                                    ", "
                                                )}\nOnly images (JPG, PNG, GIF...), PDF, ZIP, 7Z, RAR are allowed.`
                                            );
                                        }

                                        if (validFiles.length > 0) {
                                            setCreateIssueFiles((prev) => [
                                                ...prev,
                                                ...validFiles,
                                            ]);
                                        }
                                        e.target.value = "";
                                    }}
                                    style={{ display: "none" }}
                                />
                                <label
                                    htmlFor="create-issue-file-input"
                                    className={styles.fileUploadLabel}
                                >
                                    + Add Files
                                </label>
                                <span className={styles.fileTypeHint}>
                                    Allowed: Images, PDF, ZIP, 7Z, RAR
                                </span>
                                {createIssueFiles.length > 0 && (
                                    <div className={styles.selectedFilesList}>
                                        {createIssueFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className={
                                                    styles.selectedFileItem
                                                }
                                            >
                                                <span
                                                    className={styles.fileName}
                                                >
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.removeFileBtn
                                                    }
                                                    onClick={() => {
                                                        setCreateIssueFiles(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        index
                                                                )
                                                        );
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalButton} ${styles.secondary}`}
                                onClick={() => {
                                    // Check if there is entered data
                                    const hasData =
                                        issueForm.title ||
                                        issueForm.description ||
                                        issueForm.assignee ||
                                        issueForm.deadline ||
                                        issueForm.reviewer ||
                                        createIssueFiles.length > 0;

                                    if (hasData) {
                                        const confirmCancel = window.confirm(
                                            "Do you want to cancel creating this issue? All entered information will be lost."
                                        );
                                        if (confirmCancel) {
                                            setIssueForm({
                                                title: "",
                                                description: "",
                                                assignee: "",
                                                priority: "low",
                                                deadline: "",
                                                reviewer: "",
                                            });
                                            setCreateIssueFiles([]);
                                            setShowIssueModal(false);
                                        }
                                    } else {
                                        setShowIssueModal(false);
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.modalButton} ${styles.primary}`}
                                onClick={createMeetingIssue}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditScheduleModal && editingMeeting && (
                <div
                    className={styles.modalOverlay}
                    onClick={closeEditScheduleModal}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: isMobile ? "10px" : "20px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: isMobile ? "16px" : "24px",
                            maxWidth: isMobile ? "95%" : "600px",
                            width: isMobile ? "95%" : "90%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 20px 0",
                                fontSize: "18px",
                                fontWeight: "600",
                            }}
                        >
                            Edit Meeting Schedule
                        </h3>

                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                            >
                                Select day of week{" "}
                                <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {weekDays.map((day) => (
                                    <button
                                        key={day.dateString}
                                        type="button"
                                        onClick={() =>
                                            setScheduleForm((prev) => ({
                                                ...prev,
                                                meetingDate: day.dateString,
                                            }))
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            border: `2px solid ${
                                                scheduleForm.meetingDate ===
                                                day.dateString
                                                    ? "#8b5cf6"
                                                    : "#d1d5db"
                                            }`,
                                            borderRadius: "6px",
                                            backgroundColor:
                                                scheduleForm.meetingDate ===
                                                day.dateString
                                                    ? "#f3e8ff"
                                                    : "white",
                                            color:
                                                scheduleForm.meetingDate ===
                                                day.dateString
                                                    ? "#8b5cf6"
                                                    : "#374151",
                                            fontSize: "13px",
                                            fontWeight:
                                                scheduleForm.meetingDate ===
                                                day.dateString
                                                    ? "600"
                                                    : "400",
                                            cursor: "pointer",
                                            minWidth: "100px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            {day.dayName}
                                        </div>
                                        <div>{day.display}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                            >
                                Meeting Description{" "}
                                <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <Input
                                type="text"
                                value={scheduleForm.description}
                                onChange={(e) =>
                                    setScheduleForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Enter meeting description..."
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : "1fr 1fr",
                                gap: "16px",
                                marginBottom: "20px",
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: isMobile ? "12px" : "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    Start Time{" "}
                                    <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <Input
                                    type="time"
                                    value={scheduleForm.startAt}
                                    onChange={(e) =>
                                        setScheduleForm((prev) => ({
                                            ...prev,
                                            startAt: e.target.value,
                                        }))
                                    }
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: isMobile ? "12px" : "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    End Time{" "}
                                    <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <Input
                                    type="time"
                                    value={scheduleForm.endAt}
                                    onChange={(e) =>
                                        setScheduleForm((prev) => ({
                                            ...prev,
                                            endAt: e.target.value,
                                        }))
                                    }
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <Button
                                variant="secondary"
                                onClick={closeEditScheduleModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={updateMeetingSchedule}
                                style={{
                                    backgroundColor: "#8b5cf6",
                                    color: "white",
                                }}
                            >
                                Update
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Previous Meeting Minutes Modal - positioned on the left */}
            {showPreviousMinuteModal && previousMinuteData && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "fixed",
                        top: isMobile ? "10px" : "50%",
                        left: isMobile ? "10px" : "20px",
                        right: isMobile ? "10px" : "auto",
                        transform: isMobile ? "none" : "translateY(-50%)",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: isMobile ? "16px" : "24px",
                        width: isMobile ? "calc(100% - 20px)" : "40%",
                        maxWidth: isMobile ? "none" : "550px",
                        maxHeight: isMobile ? "calc(100vh - 20px)" : "90vh",
                        overflow: "auto",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        zIndex: 10001,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#1f2937",
                            }}
                        >
                            📋 Previous Meeting Minutes
                        </h3>
                        <button
                            onClick={() => setShowPreviousMinuteModal(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                fontSize: "24px",
                                cursor: "pointer",
                                color: "#6b7280",
                                padding: "4px",
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Meeting Info */}
                    <div
                        style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                color: "#065f46",
                                marginBottom: 8,
                            }}
                        >
                            <strong>Created by:</strong>{" "}
                            {previousMinuteData.createBy || "N/A"}
                        </div>
                        <div style={{ fontSize: 13, color: "#065f46" }}>
                            <strong>Created at:</strong>{" "}
                            {previousMinuteData.createAt
                                ? formatDateTime(previousMinuteData.createAt)
                                : "N/A"}
                        </div>
                    </div>

                    {/* Time */}
                    <div style={{ marginBottom: 16 }}>
                        <h4
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#065f46",
                            }}
                        >
                            Time
                        </h4>
                        <div style={{ fontSize: 13, color: "#374151" }}>
                            <div>
                                <strong>Start:</strong>{" "}
                                {previousMinuteData.startAt
                                    ? formatDateTime(previousMinuteData.startAt)
                                    : "N/A"}
                            </div>
                            <div>
                                <strong>End:</strong>{" "}
                                {previousMinuteData.endAt
                                    ? formatDateTime(previousMinuteData.endAt)
                                    : "N/A"}
                            </div>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div style={{ marginBottom: 16 }}>
                        <h4
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#065f46",
                            }}
                        >
                            Attendance List
                        </h4>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.5)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 6,
                                padding: 12,
                                fontSize: 13,
                                color: "#374151",
                                whiteSpace: "pre-wrap",
                                maxHeight: "120px",
                                overflowY: "auto",
                            }}
                        >
                            {previousMinuteData.attendance ||
                                "No attendance information available"}
                        </div>
                    </div>

                    {/* Meeting Content */}
                    <div style={{ marginBottom: 16 }}>
                        <h4
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#065f46",
                            }}
                        >
                            Meeting Content
                        </h4>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.5)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 6,
                                padding: 12,
                                fontSize: 13,
                                color: "#374151",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                minHeight: "100px",
                                maxHeight: "200px",
                                overflowY: "auto",
                            }}
                        >
                            {previousMinuteData.meetingContent ||
                                "No content available"}
                        </div>
                    </div>

                    {/* Meeting Issues */}
                    <div style={{ marginBottom: 16 }}>
                        <h4
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#065f46",
                            }}
                        >
                            Issues
                        </h4>
                        {previousMinuteIssues.length > 0 ? (
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.5)",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    borderRadius: 6,
                                    maxHeight: "180px",
                                    overflowY: "auto",
                                }}
                            >
                                {previousMinuteIssues.map((issue, idx) => (
                                    <div
                                        key={issue.id || idx}
                                        style={{
                                            padding: "10px 12px",
                                            borderBottom:
                                                idx <
                                                previousMinuteIssues.length - 1
                                                    ? "1px solid #e5e7eb"
                                                    : "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: 4,
                                            }}
                                        >
                                            <span
                                                onClick={() =>
                                                    issue.id &&
                                                    navigate(
                                                        `/student/task-detail/${issue.groupId}?taskId=${issue.id}`
                                                    )
                                                }
                                                style={{
                                                    color: "#3b82f6",
                                                    cursor: issue.id
                                                        ? "pointer"
                                                        : "default",
                                                    textDecoration: issue.id
                                                        ? "underline"
                                                        : "none",
                                                    fontWeight: 500,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {issue.name}
                                            </span>
                                            <span
                                                style={{
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    fontSize: "10px",
                                                    fontWeight: "500",
                                                    backgroundColor:
                                                        getStatusColor(
                                                            issue.status
                                                        ) + "20",
                                                    color: getStatusColor(
                                                        issue.status
                                                    ),
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {getStatusText(issue.status)}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "#6b7280",
                                            }}
                                        >
                                            <span>
                                                Deadline:{" "}
                                                {issue.deadline
                                                    ? formatDateTime(
                                                          issue.deadline
                                                      )
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.5)",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    borderRadius: 6,
                                    padding: 12,
                                    fontSize: 13,
                                    color: "#6b7280",
                                    textAlign: "center",
                                }}
                            >
                                No issues available
                            </div>
                        )}
                    </div>

                    {/* Other Notes */}
                    <div style={{ marginBottom: 16 }}>
                        <h4
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#065f46",
                            }}
                        >
                            Other Notes
                        </h4>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.5)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 6,
                                padding: 12,
                                fontSize: 13,
                                color: "#374151",
                                whiteSpace: "pre-wrap",
                                minHeight: "60px",
                                maxHeight: "100px",
                                overflowY: "auto",
                            }}
                        >
                            {previousMinuteData.other || "N/A"}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 16,
                        }}
                    >
                        <Button
                            variant="secondary"
                            onClick={() => setShowPreviousMinuteModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
