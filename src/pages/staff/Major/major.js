import React from "react";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import Switch from "../../../components/Switch/Switch";
import client from "../../../utils/axiosClient";

const ITEMS_PER_PAGE = 10;

export default function Major() {
    const [majors, setMajors] = React.useState([]);
    const [filteredMajors, setFilteredMajors] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [selectedMajor, setSelectedMajor] = React.useState(null);

    // Form states
    const [formData, setFormData] = React.useState({
        code: "",
        name: "",
        isActive: true
    });
    const [formError, setFormError] = React.useState("");

    // Load majors
    React.useEffect(() => {
        let mounted = true;
        async function loadMajors() {
            setLoading(true);
            try {
                const res = await client.get("https://160.30.21.113:5000/api/v1/Staff/getAllCodeCourse");
                const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                if (!mounted) return;
                setMajors(list);
                setFilteredMajors(list);
            } catch (err) {
                if (!mounted) return;
                setError("Failed to load majors");
                setMajors([]);
                setFilteredMajors([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadMajors();
        return () => {
            mounted = false;
        };
    }, []);

    // Filter majors based on search term
    React.useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredMajors(majors);
        } else {
            const filtered = majors.filter(major => 
                major.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                major.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMajors(filtered);
        }
        setCurrentPage(1); // Reset to first page when searching
    }, [searchTerm, majors]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredMajors.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentMajors = filteredMajors.slice(startIndex, endIndex);

    function handleSearch(e) {
        setSearchTerm(e.target.value);
    }

    function openCreateModal() {
        setFormData({ code: "", name: "", isActive: true });
        setFormError("");
        setIsCreateModalOpen(true);
    }

    function openEditModal(major) {
        setSelectedMajor(major);
        setFormData({
            code: major.code,
            name: major.name,
            isActive: major.isActive
        });
        setFormError("");
        setIsEditModalOpen(true);
    }

    function handleFormChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError("");
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim()) {
            setFormError("Code and name are required");
            return;
        }

        try {
            const payload = {
                id: 0,
                code: formData.code.trim(),
                name: formData.name.trim(),
                isActive: formData.isActive
            };

            await client.post("https://160.30.21.113:5000/api/v1/Staff/createCourse", payload);
            setIsCreateModalOpen(false);
            
            // Refresh the list
            const res = await client.get("https://160.30.21.113:5000/api/v1/Staff/getAllCodeCourse");
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setMajors(list);
            setFilteredMajors(list);
        } catch (err) {
            setFormError(err?.response?.data?.message || "Failed to create major");
        }
    }

    async function handleUpdate(e) {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim()) {
            setFormError("Code and name are required");
            return;
        }

        try {
            const payload = {
                id: 0,
                code: formData.code.trim(),
                name: formData.name.trim(),
                isActive: formData.isActive
            };

            await client.post(`https://160.30.21.113:5000/api/v1/Staff/updateCourse/${selectedMajor.id}`, payload);
            setIsEditModalOpen(false);
            
            // Refresh the list
            const res = await client.get("https://160.30.21.113:5000/api/v1/Staff/getAllCodeCourse");
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setMajors(list);
            setFilteredMajors(list);
        } catch (err) {
            setFormError(err?.response?.data?.message || "Failed to update major");
        }
    }


    function handlePageChange(page) {
        setCurrentPage(page);
    }

    function renderPagination() {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        background: i === currentPage ? "#3b82f6" : "#fff",
                        color: i === currentPage ? "#fff" : "#374151",
                        cursor: "pointer",
                        borderRadius: "6px",
                        fontSize: "14px",
                        margin: "0 2px"
                    }}
                >
                    {i}
                </button>
            );
        }

        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        background: currentPage === 1 ? "#f3f4f6" : "#fff",
                        color: currentPage === 1 ? "#9ca3af" : "#374151",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        borderRadius: "6px",
                        fontSize: "14px"
                    }}
                >
                    Previous
                </button>
                {pages}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                        color: currentPage === totalPages ? "#9ca3af" : "#374151",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        borderRadius: "6px",
                        fontSize: "14px"
                    }}
                >
                    Next
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Major Management</h2>
                <Button variant="primary" onClick={openCreateModal}>
                    Create New Major
                </Button>
            </div>
            <p style={{ marginTop: 0, color: "#64748b", marginBottom: 16 }}>
                Manage and track all majors in the system.
            </p>

            {/* Search Bar */}
            <div style={{ marginBottom: 16 }}>
                <Input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ maxWidth: "400px" }}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ 
                    background: "#fee2e2", 
                    color: "#dc2626", 
                    padding: "12px", 
                    borderRadius: "8px", 
                    marginBottom: 16 
                }}>
                    {error}
                </div>
            )}

            {/* Majors Table */}
            <div style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: "8px", 
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
            }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead style={{ background: "#f9fafb" }}>
                        <tr>
                            <th style={{ 
                                textAlign: "left", 
                                padding: "12px 16px", 
                                borderBottom: "1px solid #e5e7eb", 
                                fontWeight: 600,
                                fontSize: "14px"
                            }}>
                                Code
                            </th>
                            <th style={{ 
                                textAlign: "left", 
                                padding: "12px 16px", 
                                borderBottom: "1px solid #e5e7eb", 
                                fontWeight: 600,
                                fontSize: "14px"
                            }}>
                                Name
                            </th>
                            <th style={{ 
                                textAlign: "center", 
                                padding: "12px 16px", 
                                borderBottom: "1px solid #e5e7eb", 
                                fontWeight: 600,
                                fontSize: "14px"
                            }}>
                                Status
                            </th>
                            <th style={{ 
                                textAlign: "center", 
                                padding: "12px 16px", 
                                borderBottom: "1px solid #e5e7eb", 
                                fontWeight: 600,
                                fontSize: "14px",
                                width: "120px"
                            }}>
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ 
                                    padding: "40px", 
                                    textAlign: "center", 
                                    color: "#64748b" 
                                }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : currentMajors.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ 
                                    padding: "40px", 
                                    textAlign: "center", 
                                    color: "#64748b" 
                                }}>
                                    {searchTerm ? "No majors found matching your search" : "No majors found"}
                                </td>
                            </tr>
                        ) : (
                            currentMajors.map((major) => (
                                <tr key={major.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                            {major.code}
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ fontSize: "14px" }}>
                                            {major.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                        <span style={{
                                            background: major.isActive ? "#dcfce7" : "#fee2e2",
                                            color: major.isActive ? "#166534" : "#dc2626",
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: 600
                                        }}>
                                            {major.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => openEditModal(major)}
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {renderPagination()}

            {/* Create Major Modal */}
            <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={handleCreate} style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 16,
                    width: "500px",
                    maxWidth: "95vw"
                }}>
                    <h3 style={{ margin: 0 }}>Create New Major</h3>
                    {formError && <div style={{ color: "#dc2626" }}>{formError}</div>}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Code *</label>
                        <Input
                            value={formData.code}
                            onChange={(e) => handleFormChange("code", e.target.value)}
                            placeholder="Enter major code"
                            required
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleFormChange("name", e.target.value)}
                            placeholder="Enter major name"
                            required
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Active Status:</label>
                        <Switch
                            checked={formData.isActive}
                            onChange={(checked) => handleFormChange("isActive", checked)}
                        />
                        <span style={{ fontSize: "14px", color: "#64748b" }}>
                            {formData.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Major</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Major Modal */}
            <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <form onSubmit={handleUpdate} style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 16,
                    width: "500px",
                    maxWidth: "95vw"
                }}>
                    <h3 style={{ margin: 0 }}>Edit Major</h3>
                    {formError && <div style={{ color: "#dc2626" }}>{formError}</div>}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Code *</label>
                        <Input
                            value={formData.code}
                            onChange={(e) => handleFormChange("code", e.target.value)}
                            placeholder="Enter major code"
                            required
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleFormChange("name", e.target.value)}
                            placeholder="Enter major name"
                            required
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <label style={{ fontSize: "14px", fontWeight: 600 }}>Active Status:</label>
                        <Switch
                            checked={formData.isActive}
                            onChange={(checked) => handleFormChange("isActive", checked)}
                        />
                        <span style={{ fontSize: "14px", color: "#64748b" }}>
                            {formData.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Update Major</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
