-- Sample Data cho Schedule System (theo thứ trong tuần)
-- SQL Server

-- 1. Insert sample users (nếu chưa có)
INSERT INTO Users (Name, Email, StudentId, Role, IsActive) VALUES
('Nguyễn Văn A', 'student1@example.com', 'SE123456', 'STUDENT', 1),
('Trần Thị B', 'student2@example.com', 'SE123457', 'STUDENT', 1),
('Lê Văn C', 'student3@example.com', 'SE123458', 'STUDENT', 1),
('Phạm Thị D', 'student4@example.com', 'SE123459', 'STUDENT', 1),
('Nguyễn Văn E', 'supervisor1@example.com', 'GV001', 'SUPERVISOR', 1);

-- 2. Insert sample groups (nếu chưa có)
INSERT INTO Groups (Name, Description, SupervisorId, IsActive) VALUES
('Nhóm Capstone 1', 'Nhóm phát triển ứng dụng web', 5, 1),
('Nhóm Capstone 2', 'Nhóm phát triển ứng dụng mobile', 5, 1);

-- 3. Insert sample group members (nếu chưa có)
INSERT INTO GroupMembers (GroupId, UserId, Role, IsActive) VALUES
(1, 1, 'Leader', 1),
(1, 2, 'Member', 1),
(1, 3, 'Member', 1),
(2, 4, 'Leader', 1);

-- 4. Insert sample schedule data (theo thứ trong tuần)
INSERT INTO Schedule (UserId, GroupId, DayOfWeek, TimeSlot, CreatedBy, UpdatedBy) VALUES
-- User 1 (Nguyễn Văn A) - Nhóm 1
(1, 1, 'monday', '08:00-10:00', 1, 1),
(1, 1, 'monday', '10:00-12:00', 1, 1),
(1, 1, 'monday', '14:00-16:00', 1, 1),
(1, 1, 'tuesday', '09:00-11:00', 1, 1),
(1, 1, 'tuesday', '13:00-15:00', 1, 1),
(1, 1, 'wednesday', '08:00-10:00', 1, 1),
(1, 1, 'wednesday', '14:00-16:00', 1, 1),
(1, 1, 'friday', '09:00-11:00', 1, 1),

-- User 2 (Trần Thị B) - Nhóm 1
(2, 1, 'monday', '09:00-11:00', 2, 2),
(2, 1, 'monday', '13:00-15:00', 2, 2),
(2, 1, 'tuesday', '08:00-10:00', 2, 2),
(2, 1, 'tuesday', '14:00-16:00', 2, 2),
(2, 1, 'wednesday', '10:00-12:00', 2, 2),
(2, 1, 'wednesday', '15:00-17:00', 2, 2),
(2, 1, 'thursday', '09:00-11:00', 2, 2),
(2, 1, 'friday', '08:00-10:00', 2, 2),

-- User 3 (Lê Văn C) - Nhóm 1
(3, 1, 'monday', '10:00-12:00', 3, 3),
(3, 1, 'monday', '15:00-17:00', 3, 3),
(3, 1, 'tuesday', '09:00-11:00', 3, 3),
(3, 1, 'tuesday', '16:00-18:00', 3, 3),
(3, 1, 'wednesday', '08:00-10:00', 3, 3),
(3, 1, 'wednesday', '13:00-15:00', 3, 3),
(3, 1, 'thursday', '10:00-12:00', 3, 3),
(3, 1, 'friday', '14:00-16:00', 3, 3),

-- User 4 (Phạm Thị D) - Nhóm 2
(4, 2, 'monday', '08:00-10:00', 4, 4),
(4, 2, 'monday', '14:00-16:00', 4, 4),
(4, 2, 'tuesday', '10:00-12:00', 4, 4),
(4, 2, 'tuesday', '15:00-17:00', 4, 4),
(4, 2, 'wednesday', '09:00-11:00', 4, 4),
(4, 2, 'wednesday', '16:00-18:00', 4, 4),
(4, 2, 'thursday', '08:00-10:00', 4, 4),
(4, 2, 'friday', '13:00-15:00', 4, 4);

-- 5. Insert sample schedule votes (audit trail)
INSERT INTO ScheduleVotes (UserId, DayOfWeek, TimeSlot, IsVoted, VoteType, VoteReason, IPAddress, UserAgent) VALUES
-- User 1 votes
(1, 'monday', '08:00-10:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'monday', '10:00-12:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'monday', '14:00-16:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'tuesday', '09:00-11:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'tuesday', '13:00-15:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

-- User 2 votes
(2, 'monday', '09:00-11:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'monday', '13:00-15:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'tuesday', '08:00-10:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'tuesday', '14:00-16:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

-- User 3 votes
(3, 'monday', '10:00-12:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(3, 'monday', '15:00-17:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(3, 'tuesday', '09:00-11:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

-- User 4 votes
(4, 'monday', '08:00-10:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(4, 'monday', '14:00-16:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(4, 'tuesday', '10:00-12:00', 1, 'available', 'Rảnh để họp nhóm', '192.168.1.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

-- 6. Insert sample meeting schedule (lịch họp)
INSERT INTO MeetingSchedule (GroupId, SupervisorId, DayOfWeek, StartTime, EndTime, MeetingTitle, MeetingDescription, MeetingLink, CreatedBy, UpdatedBy) VALUES
(1, 5, 'monday', '09:00:00', '11:00:00', 'Cuộc họp tuần 1', 'Họp nhóm để review tiến độ dự án', 'https://meet.google.com/abc-defg-hij', 5, 5),
(1, 5, 'wednesday', '14:00:00', '16:00:00', 'Review code', 'Review code và thảo luận về technical issues', 'https://meet.google.com/xyz-uvw-rst', 5, 5);

-- 7. Insert sample schedule settings
INSERT INTO ScheduleSettings (GroupId, TimeInterval, StartHour, EndHour, WorkingDays, MaxVotesPerDay, VoteDeadlineHours, IsActive, IsDefault, CreatedBy, UpdatedBy) VALUES
(NULL, 60, 8, 20, 'monday,tuesday,wednesday,thursday,friday', 10, 24, 1, 1, 5, 5), -- Global settings
(1, 120, 8, 20, 'monday,tuesday,wednesday,thursday,friday', 5, 48, 1, 0, 5, 5), -- Group 1 settings
(2, 60, 9, 18, 'monday,tuesday,wednesday,thursday,friday,saturday', 15, 12, 1, 0, 5, 5); -- Group 2 settings

-- 8. Insert sample notifications
INSERT INTO ScheduleNotifications (UserId, GroupId, Type, Title, Message, Priority, IsRead, IsSent, SentAt) VALUES
(1, 1, 'meeting_finalized', 'Lịch họp đã được chốt', 'Lịch họp vào thứ hai từ 09:00:00 đến 11:00:00 đã được chốt.', 'high', 0, 1, '2024-01-15 08:00:00'),
(2, 1, 'meeting_finalized', 'Lịch họp đã được chốt', 'Lịch họp vào thứ hai từ 09:00:00 đến 11:00:00 đã được chốt.', 'high', 0, 1, '2024-01-15 08:00:00'),
(3, 1, 'meeting_finalized', 'Lịch họp đã được chốt', 'Lịch họp vào thứ hai từ 09:00:00 đến 11:00:00 đã được chốt.', 'high', 0, 1, '2024-01-15 08:00:00'),
(4, 2, 'schedule_reminder', 'Nhắc nhở vote lịch', 'Vui lòng vote lịch rảnh cho tuần tới.', 'normal', 0, 1, '2024-01-15 09:00:00');

-- 9. Insert sample analytics data
INSERT INTO ScheduleAnalytics (GroupId, UserId, Date, MetricType, MetricValue, AdditionalData) VALUES
(1, NULL, '2024-01-15', 'vote_count', 15.00, '{"totalVotes": 15, "averageVotesPerUser": 5}'),
(1, NULL, '2024-01-15', 'availability_rate', 75.50, '{"totalSlots": 20, "availableSlots": 15, "rate": 75.5}'),
(1, NULL, '2024-01-15', 'meeting_frequency', 2.00, '{"meetingsPerWeek": 2, "totalMeetings": 2}'),
(1, NULL, '2024-01-15', 'popular_time_slots', 85.00, '{"mostPopularSlot": "09:00-11:00", "popularity": 85}');

-- 10. Query để test data
-- Lấy lịch rảnh của user 1
SELECT 
    s.DayOfWeek,
    s.TimeSlot,
    s.CreatedAt
FROM Schedule s
WHERE s.UserId = 1
ORDER BY 
    CASE s.DayOfWeek 
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
    END,
    s.TimeSlot;

-- Lấy lịch rảnh của nhóm 1
SELECT 
    u.Name as UserName,
    u.StudentId,
    s.DayOfWeek,
    s.TimeSlot
FROM GroupMembers gm
INNER JOIN Users u ON gm.UserId = u.Id
LEFT JOIN Schedule s ON u.Id = s.UserId
WHERE gm.GroupId = 1 AND gm.IsActive = 1
ORDER BY u.Name, s.DayOfWeek, s.TimeSlot;

-- Lấy lịch họp của nhóm 1
SELECT 
    ms.Id,
    g.Name as GroupName,
    u.Name as SupervisorName,
    ms.DayOfWeek,
    ms.StartTime,
    ms.EndTime,
    ms.MeetingTitle,
    ms.MeetingLink,
    ms.CreatedAt
FROM MeetingSchedule ms
INNER JOIN Groups g ON ms.GroupId = g.Id
INNER JOIN Users u ON ms.SupervisorId = u.Id
WHERE ms.GroupId = 1;

-- Thống kê lịch rảnh theo thứ
SELECT 
    s.DayOfWeek,
    COUNT(*) as TotalSlots,
    COUNT(*) as AvailableSlots,
    100.00 as AvailabilityRate
FROM Schedule s
GROUP BY s.DayOfWeek
ORDER BY 
    CASE s.DayOfWeek 
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
    END;

-- Thống kê theo khung giờ
SELECT 
    s.TimeSlot,
    COUNT(*) as TotalUsers,
    COUNT(*) as AvailableUsers,
    100.00 as AvailabilityRate
FROM Schedule s
GROUP BY s.TimeSlot
ORDER BY s.TimeSlot;
