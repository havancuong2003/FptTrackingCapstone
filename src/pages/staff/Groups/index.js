import React from 'react';
import styles from './index.module.scss';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import { listCapstoneGroups, getCapstoneGroupDetail, sendEmailToGroup } from '../../../api/staff/groups';

export default function StaffGroups() {
  const [filters, setFilters] = React.useState({
    major: 'all',
    submitted: 'all',
    term: 'all',
    courseCode: 'all',
    search: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [emailContent, setEmailContent] = React.useState('');
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [options, setOptions] = React.useState({ majors: [], terms: [], courseCodes: [] });
  const [blocks, setBlocks] = React.useState({}); // key: blockIndex -> items (BLOCK_SIZE)
  const BLOCK_SIZE = 100;
  const prefetchingRef = React.useRef(new Set());
  const [filtered, setFiltered] = React.useState([]);

  function normalizeStr(str) {
    return (str || '').toString().toLowerCase().trim();
  }
  function applyClientFilters(rows, f) {
    if (!rows || rows.length === 0) return [];
    const q = normalizeStr(f.search);
    return rows.filter(g => {
      if (f.major !== 'all' && g.major !== f.major) return false;
      if (f.submitted !== 'all' && String(g.submittedDocs) !== String(f.submitted)) return false;
      if (f.term !== 'all' && g.term !== f.term) return false;
      if (f.courseCode !== 'all' && g.courseCode !== f.courseCode) return false;
      if (q) {
        const inGroupId = normalizeStr(g.id).includes(q);
        const supervisorsList = Array.isArray(g.supervisors) ? g.supervisors : (g.supervisor ? [g.supervisor] : []);
        const inSupervisor = supervisorsList.some(sv => normalizeStr(sv).includes(q));
        const inStudents = (g.students || []).some(s => normalizeStr(s.name).includes(q) || normalizeStr(s.id).includes(q));
        if (!(inGroupId || inSupervisor || inStudents)) return false;
      }
      return true;
    });
  }

  // Auto load when filters/pageSize change (reset to first block)
  React.useEffect(() => {
    const handle = setTimeout(async () => {
      // Only reset when pageSize changes; filter changes apply client-side (no API call)
      setPage(1);
      if (Object.keys(blocks).length === 0 || pageSize * 10 !== Object.values(blocks)[0]?.length) {
        setBlocks({});
        setLoading(true);
        try {
          const res = await listCapstoneGroups({ ...filters, page: 1, pageSize: BLOCK_SIZE });
          setTotal(res.data?.total || 0);
          setOptions(res.data?.options || { majors: [], terms: [], courseCodes: [] });
          setBlocks({ 0: res.data?.items || [] });
        } finally {
          setLoading(false);
        }
      } else {
        // Have first block available, apply client filter and slice first page
        const filteredRows = applyClientFilters(blocks[0] || [], filters);
        setFiltered(filteredRows);
        setItems(filteredRows.slice(0, pageSize));
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [filters, pageSize]);

  async function openDetail(id) {
    setDetail(null);
    setEmailContent('');
    setDetailOpen(true);
    const res = await getCapstoneGroupDetail(id);
    setDetail(res.data);
  }

  async function handleSendEmail() {
    if (!emailContent.trim() || !detail) return;
    
    setSendingEmail(true);
    try {
      const res = await sendEmailToGroup(detail.id, emailContent);
      
      if (res.status === 200) {
        alert('Email sent successfully!');
        setEmailContent('');
      } else {
        alert(res.message || 'An error occurred when sending email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('An error occurred when sending email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  }

  function onChangeFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Load current page from cache or fetch its block
  React.useEffect(() => {
    const blockIndex = Math.floor(((page - 1) * pageSize) / BLOCK_SIZE);
    const haveBlock = Boolean(blocks[blockIndex]);
    if (haveBlock) {
      // Apply client filter before slicing page
      const filteredRows = applyClientFilters(blocks[blockIndex] || [], filters);
      const blockStart = blockIndex * BLOCK_SIZE;
      const globalIndexStart = (page - 1) * pageSize;
      const offsetInBlock = globalIndexStart - blockStart;
      const pageItems = filteredRows.slice(offsetInBlock, offsetInBlock + pageSize);
      setFiltered(filteredRows);
      setItems(pageItems);
      return;
    }

    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const startFrom = blockIndex * BLOCK_SIZE;
        const serverPage = Math.floor(startFrom / BLOCK_SIZE) + 1;
        const res = await listCapstoneGroups({ ...filters, page: serverPage, pageSize: BLOCK_SIZE });
        if (ignore) return;
        const raw = res.data?.items || [];
        const filteredRows = applyClientFilters(raw, filters);
        setBlocks(prev => ({ ...prev, [blockIndex]: raw }));
        setTotal(res.data?.total || 0);
        setOptions(res.data?.options || { majors: [], terms: [], courseCodes: [] });
        const offsetInBlock2 = ((page - 1) * pageSize) - (blockIndex * BLOCK_SIZE);
        const pageItems2 = filteredRows.slice(offsetInBlock2, offsetInBlock2 + pageSize);
        setFiltered(filteredRows);
        setItems(pageItems2);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [page, pageSize, BLOCK_SIZE, blocks, filters]);

  // Prefetch next block in background when user nears the end of current block
  React.useEffect(() => {
    const pagesPerBlock = Math.max(1, Math.floor(BLOCK_SIZE / pageSize));
    const blockIndex = Math.floor(((page - 1) * pageSize) / BLOCK_SIZE);
    const posInBlock = (page - 1) % pagesPerBlock;
    const nearEnd = posInBlock >= pagesPerBlock - 2; // Last 2 pages
    const nextBlock = blockIndex + 1;
    if (!nearEnd) return;
    if (blocks[nextBlock]) return;
    if (prefetchingRef.current.has(nextBlock)) return;

    prefetchingRef.current.add(nextBlock);
    (async () => {
      try {
        const serverPage = nextBlock + 1; // 1-based block page
        const res = await listCapstoneGroups({ ...filters, page: serverPage, pageSize: BLOCK_SIZE });
        const raw = res.data?.items || [];
        setBlocks(prev => ({ ...prev, [nextBlock]: raw }));
      } finally {
        prefetchingRef.current.delete(nextBlock);
      }
    })();
  }, [page, pageSize, BLOCK_SIZE, blocks, filters]);

  return (
    <div className={styles.wrap}>
      <h1>Capstone Groups List</h1>

      <div className={styles.filters}>
        <div>
          <label>Major</label>
          <Select value={filters.major} onChange={e => onChangeFilter('major', e.target.value)}>
            <option value="all">All</option>
            {options.majors.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div>
          <label>Documents Submitted</label>
          <Select value={filters.submitted} onChange={e => onChangeFilter('submitted', e.target.value)}>
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </div>
        <div>
          <label>Semester</label>
          <Select value={filters.term} onChange={e => onChangeFilter('term', e.target.value)}>
            <option value="all">All</option>
            {options.terms.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <label>Course Code</label>
          <Select value={filters.courseCode} onChange={e => onChangeFilter('courseCode', e.target.value)}>
            <option value="all">All</option>
            {options.courseCodes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className={styles.searchBox}>
          <label>Search</label>
          <Input
            placeholder="Group ID / Supervisor / Student Name / Student ID"
            value={filters.search}
            onChange={e => onChangeFilter('search', e.target.value)}
          />
        </div>
        <div>
          <label>Rows per page</label>
          <Select value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </Select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No</th>
              <th>Group ID</th>
              <th>Course Code</th>
              <th>Semester</th>
              <th>Major</th>
              <th>Total Students</th>
              <th>Supervisor</th>
              <th>Documents Submitted</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>Loading...</td>
              </tr>
            )}
            {!loading && items.map((g, idx) => (
              <tr key={g.id}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{g.id}</td>
                <td>{g.courseCode}</td>
                <td>{g.term}</td>
                <td>{g.major}</td>
                <td>{g.studentCount}</td>
                <td>{(Array.isArray(g.supervisors) ? g.supervisors : (g.supervisor ? [g.supervisor] : [])).join(', ')}</td>
                <td>
                  <span className={g.submittedDocs ? styles.badgeOk : styles.badgeNo}>
                    {g.submittedDocs ? 'Submitted' : 'Missing'}
                  </span>
                </td>
                <td>
                  <Button size="sm" variant="secondary" onClick={() => openDetail(g.id)}>Details</Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
        <span>Page {page} / {totalPages}</span>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)}>
        {!detail && <div>Loading...</div>}
        {detail && (
          <div className={styles.detail}>
            <h2>Group Details</h2>
            <section>
              <h3>Group Info</h3>
              <p><strong>Group ID:</strong> {detail.id}</p>
              <p><strong>Project:</strong> {detail.projectName}</p>
              <p><strong>Supervisors:</strong> {(Array.isArray(detail.supervisors) ? detail.supervisors : (detail.supervisor ? [detail.supervisor] : [])).join(', ')}</p>
              <p><strong>Status:</strong> {detail.status}</p>
              <p><strong>Risk:</strong> {detail.risk}</p>
            </section>
            <section>
              <h3>Student Members</h3>
              <ul>
                {(detail.students || []).map(s => (
                  <li key={s.id}>{s.id} - {s.name} ({s.role})</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Activity Log</h3>
              <div className={styles.tableWrap}>
                <table className={styles.activityTable}>
                  <thead>
                    <tr>
                      <th>Duration</th>
                      <th>Content</th>
                      <th>Assignee</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.activityLog || []).map((a, i) => (
                      <tr key={i}>
                        <td>{a.timestamp}</td>
                        <td>{a.content}</td>
                        <td>{a.actor}</td>
                        <td>{a.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
            <section className={styles.emailSection}>
              <h3>Send Email to Group</h3>
              <div className={styles.emailForm}>
                <div className={styles.emailRecipients}>
                  <strong>Recipients:</strong>
                  <div className={styles.recipientList}>
                    {(detail.students || []).map(s => (
                      <span key={s.id} className={styles.recipient}>
                        {s.name} ({s.id})
                      </span>
                    ))}
                    {(Array.isArray(detail.supervisors) ? detail.supervisors : (detail.supervisor ? [detail.supervisor] : [])).map((sv, idx) => (
                      <span key={idx} className={styles.recipient}>
                        {sv} (Supervisor)
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.emailInput}>
                  <label htmlFor="emailContent">Email Content:</label>
                  <textarea
                    id="emailContent"
                    className={styles.emailTextarea}
                    placeholder="Enter the email content you want to send to the group..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className={styles.emailActions}>
                  <Button 
                    onClick={handleSendEmail}
                    disabled={!emailContent.trim() || sendingEmail}
                    variant="primary"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button 
                    onClick={() => setEmailContent('')}
                    variant="secondary"
                    disabled={sendingEmail}
                  >
                    Clear Content
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
} 