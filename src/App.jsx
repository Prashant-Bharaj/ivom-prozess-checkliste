import { useEffect, useState } from 'react';

// ============================================================================
//  IVOM-Prozess-Checkliste – Prototyp
//  Ausschliesslich synthetische Beispieldaten. Keine echten Patientendaten.
// ============================================================================

const ROLES = {
  empfang: { label: 'Empfang', short: 'E', color: '#0a6cff' },
  mfa: { label: 'Voruntersuchung (MFA)', short: 'M', color: '#7c3aed' },
  arzt: { label: 'Ärztin / Arzt', short: 'A', color: '#16a34a' },
};

// Stationen des IVOM-Tages – jeder Schritt hat eine verantwortliche Rolle.
const STATIONS = [
  {
    id: 'anmeldung',
    title: '1 · Anmeldung',
    role: 'empfang',
    steps: [
      { id: 'a1', text: 'Patient angemeldet, Identität geprüft (Name, Geburtsdatum)' },
      { id: 'a2', text: 'Diagnostik- und Spritzentermin für heute bestätigt' },
      { id: 'a3', text: 'Keine Infektion / kein Infekt am heutigen Tag (abgefragt)', critical: true },
      { id: 'a4', text: 'Behandlungsauge laut Akte bestätigt', eye: true },
    ],
  },
  {
    id: 'voruntersuchung',
    title: '2 · Voruntersuchung',
    role: 'mfa',
    steps: [
      { id: 'v1', text: 'Sehtest durchgeführt' },
      { id: 'v2', text: 'Pupillenerweiterung (Mydriasis) getropft' },
      { id: 'v3', text: 'Augeninnendruck gemessen' },
      { id: 'v4', text: 'Behandlungsauge erneut mit Patient bestätigt', eye: true },
    ],
  },
  {
    id: 'op-vorbereitung',
    title: '3 · OP-Vorbereitung',
    role: 'mfa',
    steps: [
      { id: 'p1', text: 'Lokalanästhesie (Augentropfen / Gel) appliziert' },
      { id: 'p2', text: 'Einwirkzeit ≥ 5 Minuten eingehalten' },
      { id: 'p3', text: 'Erste Desinfektion des Auges durchgeführt' },
      { id: 'p4', text: 'Behandlungsauge markiert und bestätigt', eye: true },
    ],
  },
  {
    id: 'op',
    title: '4 · OP / Injektion',
    role: 'arzt',
    steps: [
      { id: 'o1', text: 'Patientenakte geöffnet: Auge, Medikament, Indikation geprüft' },
      { id: 'o2', text: 'Letzte Kontrolle Behandlungsauge durch Ärztin/Arzt (Team-Time-out)', eye: true, critical: true },
      { id: 'o3', text: 'Zweite Desinfektion durchgeführt' },
      { id: 'o4', text: 'Injektion durchgeführt und dokumentiert' },
      { id: 'o5', text: 'Weiteres Therapieschema festgelegt (z. B. nächste IVOM in 4 Wochen)' },
    ],
  },
  {
    id: 'entlassung',
    title: '5 · Entlassung / Termine',
    role: 'empfang',
    steps: [
      { id: 'e1', text: 'Nachkontrolle vereinbart (Tag 3–5 postoperativ)' },
      { id: 'e2', text: 'Folgetermin nächste IVOM laut Schema vereinbart' },
      { id: 'e3', text: 'Richtiges Auge im Folgetermin hinterlegt', eye: true },
      { id: 'e4', text: 'Verhaltenshinweise & Notfallnummer ausgehändigt' },
    ],
  },
];

const ALL_STEPS = STATIONS.flatMap((s) => s.steps.map((st) => ({ ...st, station: s.id, role: s.role })));

// Synthetische Beispielpatienten (frei erfunden)
const PATIENTS = [
  { id: 'p1', name: 'Muster, Anna', born: '12.03.1948', time: '08:15', eye: 'R', diagnosis: 'Feuchte AMD', drug: 'Aflibercept' },
  { id: 'p2', name: 'Beispiel, Karl', born: '30.07.1955', time: '08:45', eye: 'L', diagnosis: 'Diabetisches Makulaödem', drug: 'Ranibizumab' },
  { id: 'p3', name: 'Testmann, Erika', born: '05.11.1941', time: '09:15', eye: 'R', diagnosis: 'Feuchte AMD', drug: 'Faricimab' },
  { id: 'p4', name: 'Demo, Friedrich', born: '19.01.1960', time: '09:45', eye: 'L', diagnosis: 'RVV-Makulaödem', drug: 'Aflibercept' },
  { id: 'p5', name: 'Probe, Helga', born: '22.09.1952', time: '10:15', eye: 'R', diagnosis: 'Feuchte AMD', drug: 'Ranibizumab' },
];

const STORAGE_KEY = 'ivom-checkliste-demo';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  // Vorbelegung, damit das Dashboard nicht leer wirkt
  return {
    p1: { a1: 'empfang', a2: 'empfang', a3: 'empfang', a4: 'empfang', v1: 'mfa', v2: 'mfa', v3: 'mfa', v4: 'mfa', p1: 'mfa', p2: 'mfa', p3: 'mfa', p4: 'mfa' },
    p2: { a1: 'empfang', a2: 'empfang', a3: 'empfang', a4: 'empfang', v1: 'mfa', v2: 'mfa' },
    p3: { a1: 'empfang', a2: 'empfang', a3: 'empfang', a4: 'empfang' },
    p4: {},
    p5: {},
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checks, setChecks] = useState(loadState);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  }, [checks]);

  if (!user) return <Login onLogin={setUser} />;

  const patient = PATIENTS.find((p) => p.id === selected);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="dot" style={{ background: ROLES[user].color }} />
          IVOM-Tagesablauf · Praxis-Checkliste
        </div>
        <div className="topbar-right">
          <span className="pill" style={{ borderColor: ROLES[user].color, color: ROLES[user].color }}>
            Angemeldet: {ROLES[user].label}
          </span>
          <button className="ghost" onClick={() => { setUser(null); setSelected(null); }}>Abmelden</button>
        </div>
      </header>

      <main className="container wide">
        {patient ? (
          <PatientView
            patient={patient}
            checks={checks[patient.id] || {}}
            user={user}
            onBack={() => setSelected(null)}
            onToggle={(stepId) =>
              setChecks((prev) => {
                const cur = { ...(prev[patient.id] || {}) };
                if (cur[stepId]) delete cur[stepId]; else cur[stepId] = user;
                return { ...prev, [patient.id]: cur };
              })
            }
          />
        ) : (
          <Dashboard checks={checks} user={user} onSelect={setSelected} />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Login({ onLogin }) {
  const [role, setRole] = useState('empfang');
  const [pin, setPin] = useState('');
  return (
    <div className="login-wrap">
      <div className="card login">
        <div className="brand big"><span className="dot" />IVOM-Tagesablauf</div>
        <p className="lead">Bitte Arbeitsplatz wählen und anmelden.</p>
        <div className="role-grid">
          {Object.entries(ROLES).map(([key, r]) => (
            <button
              key={key}
              type="button"
              className={`role-btn ${role === key ? 'active' : ''}`}
              style={{ '--c': r.color }}
              onClick={() => setRole(key)}
            >
              <span className="avatar" style={{ background: r.color }}>{r.short}</span>
              {r.label}
            </button>
          ))}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); onLogin(role); }}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN (Demo: beliebig)"
            maxLength={8}
          />
          <button type="submit">Anmelden</button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function progressOf(checks) {
  const done = ALL_STEPS.filter((s) => checks[s.id]).length;
  return { done, total: ALL_STEPS.length, pct: Math.round((done / ALL_STEPS.length) * 100) };
}

function currentStation(checks) {
  for (const s of STATIONS) {
    if (s.steps.some((st) => !checks[st.id])) return s;
  }
  return null;
}

function Dashboard({ checks, user, onSelect }) {
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return (
    <>
      <section className="card head">
        <div>
          <h1>Injektionstag · {today}</h1>
          <p className="lead">{PATIENTS.length} Patienten geplant · Klick auf einen Patienten öffnet die Stations-Checkliste.</p>
        </div>
        <div className="legend">
          {Object.values(ROLES).map((r) => (
            <span key={r.label} className="legend-item"><span className="avatar sm" style={{ background: r.color }}>{r.short}</span>{r.label}</span>
          ))}
        </div>
      </section>

      <section className="grid">
        {PATIENTS.map((p) => {
          const c = checks[p.id] || {};
          const prog = progressOf(c);
          const station = currentStation(c);
          const myTurn = station && station.role === user;
          return (
            <button key={p.id} className={`card patient ${myTurn ? 'my-turn' : ''}`} onClick={() => onSelect(p.id)}>
              <div className="patient-top">
                <span className="time">{p.time}</span>
                <span className={`eye eye-${p.eye}`}>{p.eye === 'R' ? 'Rechtes Auge' : 'Linkes Auge'}</span>
              </div>
              <div className="patient-name">{p.name}</div>
              <div className="patient-meta">* {p.born} · {p.diagnosis} · {p.drug}</div>
              <div className="stations-dots">
                {STATIONS.map((s) => {
                  const done = s.steps.every((st) => c[st.id]);
                  const started = s.steps.some((st) => c[st.id]);
                  return <span key={s.id} className={`sdot ${done ? 'done' : started ? 'partial' : ''}`} title={s.title} />;
                })}
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: prog.pct + '%' }} /></div>
              <div className="patient-foot">
                <span>{prog.done}/{prog.total} Schritte</span>
                <span className="status">
                  {station ? (
                    <><span className="avatar sm" style={{ background: ROLES[station.role].color }}>{ROLES[station.role].short}</span>{station.title.slice(4)}</>
                  ) : '✓ Abgeschlossen'}
                </span>
              </div>
              {myTurn && <div className="my-turn-badge">Jetzt bei dir</div>}
            </button>
          );
        })}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
function PatientView({ patient, checks, user, onBack, onToggle }) {
  const prog = progressOf(checks);
  const infection = checks['a3'];
  return (
    <>
      <button className="ghost back" onClick={onBack}>← Zurück zur Übersicht</button>

      <section className="card head">
        <div>
          <h1>{patient.name}</h1>
          <p className="lead">* {patient.born} · {patient.time} Uhr · {patient.diagnosis} · {patient.drug}</p>
        </div>
        <div className={`eye big eye-${patient.eye}`}>
          <span className="eye-label">Behandlungsauge</span>
          <span className="eye-side">{patient.eye === 'R' ? 'RECHTS' : 'LINKS'}</span>
        </div>
      </section>

      <div className="bar tall"><div className="bar-fill" style={{ width: prog.pct + '%' }} /></div>

      {STATIONS.map((s) => {
        const mine = s.role === user || user === 'arzt';
        const done = s.steps.every((st) => checks[st.id]);
        return (
          <section key={s.id} className={`card station ${done ? 'done' : ''} ${mine ? '' : 'readonly'}`}>
            <div className="station-head">
              <h2><span className="avatar sm" style={{ background: ROLES[s.role].color }}>{ROLES[s.role].short}</span>{s.title}</h2>
              <span className="pill">{done ? 'Abgeschlossen' : mine ? 'Bearbeitbar' : `Nur ${ROLES[s.role].label}`}</span>
            </div>
            <ul className="checks">
              {s.steps.map((st) => {
                const by = checks[st.id];
                return (
                  <li key={st.id} className={`${by ? 'checked' : ''} ${st.critical ? 'critical' : ''}`}>
                    <label>
                      <input type="checkbox" checked={!!by} disabled={!mine} onChange={() => onToggle(st.id)} />
                      <span className="text">
                        {st.text}
                        {st.eye && <span className={`eye inline eye-${patient.eye}`}>{patient.eye}</span>}
                      </span>
                      {by && <span className="by"><span className="avatar sm" style={{ background: ROLES[by].color }}>{ROLES[by].short}</span></span>}
                    </label>
                  </li>
                );
              })}
            </ul>
            {s.id === 'op' && !infection && (
              <div className="warn">⚠ Infektionsausschluss an der Anmeldung noch nicht bestätigt – Injektion erst nach Klärung.</div>
            )}
          </section>
        );
      })}
    </>
  );
}
