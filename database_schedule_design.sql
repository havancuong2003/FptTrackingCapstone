-- Database Design cho Schedule System
-- SQL Server

-- 1. Bảng Users (đã có sẵn)
-- Users: Id, Name, Email, Role, etc.

-- 2. Bảng Groups (đã có sẵn) 
-- Groups: Id, Name, Description, SupervisorId, etc.

-- 3. Bảng GroupMembers (đã có sẵn)
-- GroupMembers: Id, GroupId, UserId, Role, etc.

-- 4. Bảng Schedule (Lịch rảnh của user)
CREATE TABLE Schedule (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Date DATE NOT NULL,
    TimeSlot NVARCHAR(20) NOT NULL, -- Format: "08:00-10:00"
    IsAvailable BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_Schedule_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT UQ_Schedule_User_Date_Time UNIQUE (UserId, Date, TimeSlot)
);

-- 5. Bảng MeetingSchedule (Lịch họp đã chốt)
CREATE TABLE MeetingSchedule (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GroupId INT NOT NULL,
    SupervisorId INT NOT NULL,
    DayOfWeek NVARCHAR(20) NOT NULL, -- "monday", "tuesday", etc.
    StartTime TIME NOT NULL, -- "09:00:00"
    EndTime TIME NOT NULL, -- "11:00:00"
    IsFinalized BIT NOT NULL DEFAULT 0,
    FinalizedAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_MeetingSchedule_Groups FOREIGN KEY (GroupId) REFERENCES Groups(Id),
    CONSTRAINT FK_MeetingSchedule_Supervisor FOREIGN KEY (SupervisorId) REFERENCES Users(Id)
);

-- 6. Bảng ScheduleVotes (Vote lịch rảnh)
CREATE TABLE ScheduleVotes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Date DATE NOT NULL,
    TimeSlot NVARCHAR(20) NOT NULL,
    IsVoted BIT NOT NULL DEFAULT 1,
    VotedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_ScheduleVotes_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT UQ_ScheduleVotes_User_Date_Time UNIQUE (UserId, Date, TimeSlot)
);

-- 7. Bảng ScheduleSettings (Cài đặt lịch)
CREATE TABLE ScheduleSettings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GroupId INT NULL, -- NULL = global settings
    TimeInterval INT NOT NULL DEFAULT 60, -- 30, 60, 120 phút
    StartHour INT NOT NULL DEFAULT 8,
    EndHour INT NOT NULL DEFAULT 20,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_ScheduleSettings_Groups FOREIGN KEY (GroupId) REFERENCES Groups(Id)
);

-- Indexes để tối ưu performance
CREATE INDEX IX_Schedule_UserId_Date ON Schedule(UserId, Date);
CREATE INDEX IX_Schedule_Date_TimeSlot ON Schedule(Date, TimeSlot);
CREATE INDEX IX_MeetingSchedule_GroupId ON MeetingSchedule(GroupId);
CREATE INDEX IX_ScheduleVotes_UserId_Date ON ScheduleVotes(UserId, Date);

-- Stored Procedures

-- 1. Lấy lịch rảnh của user trong khoảng thời gian
CREATE PROCEDURE GetUserSchedule
    @UserId INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SELECT 
        s.Date,
        s.TimeSlot,
        s.IsAvailable,
        s.CreatedAt,
        s.UpdatedAt
    FROM Schedule s
    WHERE s.UserId = @UserId
        AND s.Date BETWEEN @StartDate AND @EndDate
        AND s.IsAvailable = 1
    ORDER BY s.Date, s.TimeSlot;
END;

-- 2. Lấy lịch rảnh của tất cả thành viên trong nhóm
CREATE PROCEDURE GetGroupMembersSchedule
    @GroupId INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SELECT 
        u.Id as UserId,
        u.Name as UserName,
        u.StudentId,
        s.Date,
        s.TimeSlot,
        s.IsAvailable
    FROM GroupMembers gm
    INNER JOIN Users u ON gm.UserId = u.Id
    LEFT JOIN Schedule s ON u.Id = s.UserId 
        AND s.Date BETWEEN @StartDate AND @EndDate
        AND s.IsAvailable = 1
    WHERE gm.GroupId = @GroupId
    ORDER BY u.Name, s.Date, s.TimeSlot;
END;

-- 3. Vote lịch rảnh
CREATE PROCEDURE VoteSchedule
    @UserId INT,
    @Date DATE,
    @TimeSlot NVARCHAR(20),
    @IsVoted BIT
AS
BEGIN
    BEGIN TRANSACTION;
    
    -- Xóa vote cũ nếu có
    DELETE FROM ScheduleVotes 
    WHERE UserId = @UserId AND Date = @Date AND TimeSlot = @TimeSlot;
    
    -- Thêm vote mới
    IF @IsVoted = 1
    BEGIN
        INSERT INTO ScheduleVotes (UserId, Date, TimeSlot, IsVoted)
        VALUES (@UserId, @Date, @TimeSlot, @IsVoted);
        
        -- Cập nhật hoặc thêm vào Schedule
        IF EXISTS (SELECT 1 FROM Schedule WHERE UserId = @UserId AND Date = @Date AND TimeSlot = @TimeSlot)
        BEGIN
            UPDATE Schedule 
            SET IsAvailable = 1, UpdatedAt = GETDATE()
            WHERE UserId = @UserId AND Date = @Date AND TimeSlot = @TimeSlot;
        END
        ELSE
        BEGIN
            INSERT INTO Schedule (UserId, Date, TimeSlot, IsAvailable)
            VALUES (@UserId, @Date, @TimeSlot, 1);
        END
    END
    ELSE
    BEGIN
        -- Nếu bỏ vote thì đánh dấu không rảnh
        UPDATE Schedule 
        SET IsAvailable = 0, UpdatedAt = GETDATE()
        WHERE UserId = @UserId AND Date = @Date AND TimeSlot = @TimeSlot;
    END
    
    COMMIT TRANSACTION;
END;

-- 4. Chốt lịch họp
CREATE PROCEDURE FinalizeMeeting
    @GroupId INT,
    @SupervisorId INT,
    @DayOfWeek NVARCHAR(20),
    @StartTime TIME,
    @EndTime TIME
AS
BEGIN
    BEGIN TRANSACTION;
    
    -- Hủy chốt lịch cũ nếu có
    UPDATE MeetingSchedule 
    SET IsFinalized = 0, UpdatedAt = GETDATE()
    WHERE GroupId = @GroupId AND IsFinalized = 1;
    
    -- Chốt lịch mới
    INSERT INTO MeetingSchedule (GroupId, SupervisorId, DayOfWeek, StartTime, EndTime, IsFinalized, FinalizedAt)
    VALUES (@GroupId, @SupervisorId, @DayOfWeek, @StartTime, @EndTime, 1, GETDATE());
    
    COMMIT TRANSACTION;
END;

-- 5. Lấy lịch họp đã chốt của nhóm
CREATE PROCEDURE GetFinalizedMeeting
    @GroupId INT
AS
BEGIN
    SELECT 
        ms.Id,
        ms.GroupId,
        g.Name as GroupName,
        ms.SupervisorId,
        u.Name as SupervisorName,
        ms.DayOfWeek,
        ms.StartTime,
        ms.EndTime,
        ms.IsFinalized,
        ms.FinalizedAt
    FROM MeetingSchedule ms
    INNER JOIN Groups g ON ms.GroupId = g.Id
    INNER JOIN Users u ON ms.SupervisorId = u.Id
    WHERE ms.GroupId = @GroupId AND ms.IsFinalized = 1;
END;

-- Sample Data
-- Thêm dữ liệu mẫu
INSERT INTO ScheduleSettings (GroupId, TimeInterval, StartHour, EndHour) 
VALUES 
    (NULL, 60, 8, 20), -- Global settings
    (1, 120, 8, 20);   -- Group 1 settings

-- Views để dễ query
CREATE VIEW v_UserSchedule AS
SELECT 
    s.Id,
    s.UserId,
    u.Name as UserName,
    u.StudentId,
    s.Date,
    s.TimeSlot,
    s.IsAvailable,
    s.CreatedAt,
    s.UpdatedAt
FROM Schedule s
INNER JOIN Users u ON s.UserId = u.Id
WHERE s.IsAvailable = 1;

CREATE VIEW v_GroupSchedule AS
SELECT 
    g.Id as GroupId,
    g.Name as GroupName,
    s.UserId,
    u.Name as UserName,
    u.StudentId,
    s.Date,
    s.TimeSlot,
    s.IsAvailable
FROM Groups g
INNER JOIN GroupMembers gm ON g.Id = gm.GroupId
INNER JOIN Users u ON gm.UserId = u.Id
LEFT JOIN Schedule s ON u.Id = s.UserId AND s.IsAvailable = 1;
