import React, { useState, useMemo } from "react";
import defaultData from "./data";

const ESTADO_CONFIG = {
  aprobado:   { label: "Aprobado",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  revisar:    { label: "Revisar",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  descartado: { label: "Descartado", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

function ratioColor(r) {
  return r <= 30 ? "#16a34a" : r <= 35 ? "#65a30d" : r <= 40 ? "#d97706" : "#dc2626";
}

function RatioBar({ ratio }) {
  const pct = Math.min((ratio / 60) * 100, 100);
  const color = ratioColor(ratio);
  return (
    <div className="ratio-bar-wrap">
      <div className="ratio-track">
        <div className="ratio-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ratio-text" style={{ color }}>{ratio}%</span>
    </div>
  );
}

function Badge({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.revisar;
  return <span className={`badge badge-${estado}`}>{c.label}</span>;
}

function CandidateCard({ c, precio, expanded, onToggle }) {
  const ratio = Math.round((precio / c.ingresosNetos) * 100);
  const est = ESTADO_CONFIG[c.estado] || ESTADO_CONFIG.revisar;

  return (
    <div
      className="card"
      style={{ borderColor: est.border, borderLeftColor: est.color }}
      onClick={onToggle}
    >
      <div className="card-header">
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <div className="card-name">{c.nombre}</div>
          <div className="card-sub">
            {c.personas === 1 ? "1 persona" : `${c.personas} personas`}
            {c.mascotas ? " · 🐾 mascota" : ""}
          </div>
        </div>
        <div className="card-income">
          <div className="card-income-val">
            <strong>{c.ingresosNetos.toLocaleString("es-ES")} €</strong>
            <span> /mes</span>
          </div>
          <RatioBar ratio={ratio} />
        </div>
        <div><Badge estado={c.estado} /></div>
        <div className={`chevron ${expanded ? "open" : ""}`}>▾</div>
      </div>

      {expanded && (
        <div className="card-detail">
          <div className="card-grid">
            <div><span className="label">Tel:</span> <span className="val">{c.telefono}</span></div>
            <div><span className="label">Email:</span> <span className="val">{c.email}</span></div>
            <div className="full">
              <span className="label">Contrato:</span> <span className="val">{c.contrato}</span>
            </div>
            {c.notas && <div className="full card-note">{c.notas}</div>}
            {c.motivoDescarte && <div className="full card-descarte">✕ {c.motivoDescarte}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultData, null, 2));
  const [editMode, setEditMode] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [expanded, setExpanded] = useState({});

  const data = useMemo(() => {
    try {
      const d = JSON.parse(jsonText);
      setParseError(null);
      return d;
    } catch (e) {
      setParseError(e.message);
      return null;
    }
  }, [jsonText]);

  const candidatos = data?.candidatos || [];
  const inmueble = data?.inmueble || {};
  const filtered = filter === "todos" ? candidatos : candidatos.filter(c => c.estado === filter);

  const counts = {
    todos: candidatos.length,
    aprobado: candidatos.filter(c => c.estado === "aprobado").length,
    revisar: candidatos.filter(c => c.estado === "revisar").length,
    descartado: candidatos.filter(c => c.estado === "descartado").length,
  };

  const statItems = [
    { key: "todos",      label: "Total",       color: "#334155" },
    { key: "aprobado",   label: "Aprobados",   color: "#16a34a" },
    { key: "revisar",    label: "Revisar",     color: "#d97706" },
    { key: "descartado", label: "Descartados", color: "#dc2626" },
  ];

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div>
            <div className="header-label">Hompers · Qualificació</div>
            <h1 className="header-title">{inmueble.nombre || "—"}</h1>
          </div>
          <div className="header-right">
            <div>
              <div className="header-price">
                {inmueble.precio || "—"}<span> €/mes</span>
              </div>
              <div className="header-meta">
                Máx {inmueble.maxPersonas || "—"} pers · {inmueble.mascotasPermitidas ? "Mascotas OK" : "No mascotas"} · Mín {inmueble.duracionMinima || "—"}
              </div>
            </div>
            <button
              className={`btn-json ${editMode ? "active" : ""}`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "✓ Cerrar JSON" : "{ } Editar JSON"}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Editor */}
      {editMode && (
        <div className="json-editor">
          {parseError && <div className="json-error">Error JSON: {parseError}</div>}
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      {/* Stats */}
      <div className="stats">
        {statItems.map(s => {
          const est = ESTADO_CONFIG[s.key];
          return (
            <button
              key={s.key}
              className={`stat-btn ${filter === s.key ? "active" : ""}`}
              style={{
                borderColor: filter === s.key ? s.color : "#e2e8f0",
                background: filter === s.key && est ? est.bg : "#fff",
              }}
              onClick={() => setFilter(s.key)}
            >
              <div className="stat-num" style={{ color: s.color }}>{counts[s.key]}</div>
              <div className="stat-label">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Candidate list */}
      <div className="list">
        {data && filtered.length === 0 && (
          <div className="empty">Sin candidatos en esta categoría.</div>
        )}
        {filtered.map((c, i) => {
          const key = `${i}-${c.nombre}`;
          return (
            <CandidateCard
              key={key}
              c={c}
              precio={inmueble.precio || 830}
              expanded={!!expanded[key]}
              onToggle={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="footer">
        Hompers · Qualificació de candidats · {new Date().toLocaleDateString("ca-ES")}
      </div>
    </>
  );
}
