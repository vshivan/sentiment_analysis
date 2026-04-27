import React, { useEffect, useState } from "react";
import { fetchAuditLogs } from "../api";
import Spinner from "../components/Spinner";
import { Shield, RefreshCw } from "lucide-react";
import styles from "./AuditPage.module.css";

const ACTION_COLORS = {
  LOGIN:  "var(--cyan)",
  CREATE: "var(--positive)",
  UPDATE: "var(--neutral)",
  DELETE: "var(--negative)",
  EXPORT: "var(--amber)",
  IMPORT: "var(--positive)",
  SCRAPE: "var(--cyan)",
};

export default function AuditPage() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs(p);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
      setPage(p);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Security</p>
          <h1 className={styles.title}><Shield size={20} style={{marginRight:8,opacity:0.8}}/>Audit Log</h1>
          <p className={styles.subtitle}>Complete history of all user actions and system events</p>
        </div>
        <button className="btn-ghost" onClick={() => load(page)}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? <Spinner label="Loading audit log…"/> : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Detail</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={styles.row}>
                      <td className={styles.idCell}>{log.id}</td>
                      <td className={styles.timeCell}>{new Date(log.created_at).toLocaleString()}</td>
                      <td>
                        <span className={styles.userChip}>{log.user}</span>
                      </td>
                      <td>
                        <span className={styles.actionBadge} style={{
                          color: ACTION_COLORS[log.action] || "var(--text-3)",
                          background: `${ACTION_COLORS[log.action] || "var(--text-3)"}18`,
                          border: `1px solid ${ACTION_COLORS[log.action] || "var(--text-3)"}30`,
                        }}>{log.action}</span>
                      </td>
                      <td className={styles.resourceCell}>{log.resource}</td>
                      <td className={styles.detailCell}>{log.detail || "—"}</td>
                      <td className={styles.ipCell}>{log.ip_address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button className="btn-ghost" disabled={!pagination.has_prev} onClick={() => load(page-1)}>← Prev</button>
                <span className={styles.pageInfo}>Page {pagination.page} of {pagination.pages} · {pagination.total} total</span>
                <button className="btn-ghost" disabled={!pagination.has_next} onClick={() => load(page+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
