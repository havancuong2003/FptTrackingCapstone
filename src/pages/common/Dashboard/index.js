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
  ResponsiveContainer
} from "recharts";
// import styles from "./Dashboard.module.scss";
import styles from "./index.module.scss";
import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import { getCurrentUser } from "../../../auth/auth";

export default function Dashboard() {
  const [code, setCode] = React.useState("SEP490");

  // Dữ liệu cho từng code
  const reportDataset = {
    SEP490: [
      { name: "Đúng hạn", value: 30, color: "#1E90FF" },
      { name: "Muộn", value: 5, color: "#00CED1" },
      { name: "Không nộp", value: 2, color: "#40E0D0" },
    ],
    GRA491: [
      { name: "Đúng hạn", value: 20, color: "#1E90FF" },
      { name: "Muộn", value: 10, color: "#00CED1" },
      { name: "Không nộp", value: 5, color: "#40E0D0" },
    ],
  };

  // Data cho biểu đồ cột (Defense Participation)
  const defenseData = [
    { code: "SEP490", value: 60 },
    { code: "GRA491", value: 50 },
    { code: "ABC123", value: 40 },
    { code: "XYZ456", value: 35 },
  ];

  // Chọn dữ liệu theo code
  const reportData = reportDataset[code] || [];

  return (
    <div className={styles["dashboard-wrap"]}>
      <h1 className={styles["dashboard-title"]}>Dashboard</h1>

      {/* Grid 2 cột */}
      <div className={styles["dashboard-grid"]}>
        
        {/* Report Submission */}
        <div className={styles["dashboard-card"]}>
          <h2 className={styles["dashboard-subtitle"]}>Report Submission</h2>
          <div className={styles["dashboard-select"]}>
            <label>Code:&nbsp;</label>
            <select value={code} onChange={(e) => setCode(e.target.value)}>
              <option value="SEP490">SEP490</option>
              <option value="GRA491">GRA491</option>
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

        {/* Defense Participation */}
        <div className={styles["dashboard-card"]}>
          <h2 className={styles["dashboard-subtitle"]}>Defense Participation</h2>
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
        </div>

      </div>
    </div>
  );
}
