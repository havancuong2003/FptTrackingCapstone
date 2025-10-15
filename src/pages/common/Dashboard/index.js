import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styles from "./index.module.scss";
import client from "../../../utils/axiosClient"; // ✅ axiosClient có withCredentials: true
import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";

// ✅ Constants
const USER_INFO_KEY = "auth_user";

// ✅ Hàm lấy user từ localStorage
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [code, setCode] = React.useState("SEP490");
  const [milestone, setMilestone] = React.useState("M1");
  const [defenseData, setDefenseData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // -------------------------------
  // DỮ LIỆU GIẢ ĐỊNH CHO BIỂU ĐỒ REPORT
  // -------------------------------
  const reportDataset = {
    SEP490: {
      M1: [
        { name: "Đúng hạn", value: 15, color: "#1E90FF" },
        { name: "Muộn", value: 3, color: "#00CED1" },
        { name: "Không nộp", value: 1, color: "#40E0D0" },
      ],
      M2: [
        { name: "Đúng hạn", value: 20, color: "#1E90FF" },
        { name: "Muộn", value: 2, color: "#00CED1" },
        { name: "Không nộp", value: 1, color: "#40E0D0" },
      ],
    },
    GRA491: {
      M1: [
        { name: "Đúng hạn", value: 8, color: "#1E90FF" },
        { name: "Muộn", value: 5, color: "#00CED1" },
        { name: "Không nộp", value: 2, color: "#40E0D0" },
      ],
      M2: [
        { name: "Đúng hạn", value: 9, color: "#1E90FF" },
        { name: "Muộn", value: 4, color: "#00CED1" },
        { name: "Không nộp", value: 3, color: "#40E0D0" },
      ],
    },
  };

  // -------------------------------
  // FETCH DỮ LIỆU BẢO VỆ (DÙNG COOKIE)
  // -------------------------------
  React.useEffect(() => {
    const fetchDefenseData = async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ Không cần token, cookie sẽ tự gửi kèm theo
        const res = await client.get(
          "/Staff/dashboard-majors-groups",
          { withCredentials: true }
        );

        const formattedData =
          res?.data?.data?.map((item) => ({
            code: item?.name || "Không xác định",
            value: item?.total || 0,
          })) || [];

        setDefenseData(formattedData);
      } catch (err) {
        console.error("❌ Fetch defense data failed:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu từ API."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDefenseData();
  }, []);

  // -------------------------------
  // TỔNG SỐ NHÓM BẢO VỆ
  // -------------------------------
  const totalDefenseGroups = defenseData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // -------------------------------
  // THÔNG TIN KỲ HỌC (giả định)
  // -------------------------------
  const semesterInfo = {
    startDate: "2025-02-15",
    endDate: "2025-06-15",
  };

  // -------------------------------
  // DỮ LIỆU REPORT THEO CODE + MILESTONE
  // -------------------------------
  const reportData = reportDataset[code]?.[milestone] || [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className={styles["dashboard-wrap"]}>
      <h1 className={styles["dashboard-title"]}>Dashboard</h1>

      {/* Tổng quan */}
      <div className={styles["dashboard-summary-grid"]}>
        <div className={styles["summary-card"]}>
          <h3>Tổng số nhóm bảo vệ</h3>
          <p className={styles["summary-value"]}>
            {loading ? "Đang tải..." : totalDefenseGroups}
          </p>
        </div>
        <div className={styles["summary-card"]}>
          <h3>Thời gian bắt đầu kỳ</h3>
          <p className={styles["summary-value"]}>
            {formatDate(semesterInfo.startDate)}
          </p>
        </div>
        <div className={styles["summary-card"]}>
          <h3>Thời gian kết thúc kỳ</h3>
          <p className={styles["summary-value"]}>
            {formatDate(semesterInfo.endDate)}
          </p>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className={styles["dashboard-grid"]}>
        {/* Nộp báo cáo */}
        <div className={styles["dashboard-card"]}>
          <h2 className={styles["dashboard-subtitle"]}>Nộp Báo Cáo</h2>

          <div className={styles["dashboard-filters"]}>
            <label>Code:&nbsp;</label>
            <select value={code} onChange={(e) => setCode(e.target.value)}>
              <option value="SEP490">SEP490</option>
              <option value="GRA491">GRA491</option>
            </select>

            <label>&nbsp;Milestone:&nbsp;</label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
            >
              <option value="M1">Milestone 1</option>
              <option value="M2">Milestone 2</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={reportData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tham gia bảo vệ */}
        <div className={styles["dashboard-card"]}>
          <h2 className={styles["dashboard-subtitle"]}>Tham Gia Bảo Vệ</h2>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={defenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1E90FF" name="Số nhóm" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
