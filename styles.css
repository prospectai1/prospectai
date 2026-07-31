/* ============================================================
   ProspectAI Brand System
   Primary:    #6366F1 (Indigo)   — actions, links, active states
   Secondary:  #14B8A6 (Teal)     — growth/positive metrics
   Accent:     #A855F7 (Violet)   — AI-generated content, brand marks
   Success:    #22C55E  Warning: #F59E0B  Danger: #EF4444
   Background: #0B0E14  Surface: #12161F / #171C27
   Text:       #E7EAF2 (primary)  #9AA3B8 (secondary)  #6B7386 (faint)
   Border:     #232938
   Type:       Inter (heading + body), system-ui fallback — no external
               font requests, everything renders with zero network calls.
   ============================================================ */
:root{
  --bg:#0b0e14;
  --panel:#12161f;
  --panel-2:#171c27;
  --border:#232938;
  --text:#e7eaf2;
  --text-dim:#9aa3b8;
  --text-faint:#6b7386;
  --indigo:#6366f1;
  --indigo-dim:#4338ca;
  --teal:#14b8a6;
  --green:#22c55e;
  --amber:#f59e0b;
  --red:#ef4444;
  --blue:#3b82f6;
  --purple:#a855f7;
  --radius:12px;
  --radius-sm:8px;
  font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);height:100%;}
body{font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;}
#app{min-height:100vh;display:flex;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;cursor:pointer;}
::-webkit-scrollbar{width:8px;height:8px;}
::-webkit-scrollbar-thumb{background:#2a3142;border-radius:8px;}
::-webkit-scrollbar-track{background:transparent;}

/* Shell */
.shell{display:flex;width:100%;min-height:100vh;}
.sidebar{width:230px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
.sidebar .brand{display:flex;align-items:center;gap:10px;padding:18px 16px;border-bottom:1px solid var(--border);}
.sidebar .brand .mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--indigo),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;}
.sidebar .brand .name{font-weight:700;font-size:15px;letter-spacing:.2px;}
.sidebar .brand .sub{font-size:10.5px;color:var(--text-faint);margin-top:1px;}
.nav{padding:10px;flex:1;overflow-y:auto;}
.nav-section{margin-bottom:14px;}
.nav-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);padding:8px 10px 4px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--radius-sm);color:var(--text-dim);font-size:13.5px;font-weight:500;margin-bottom:2px;}
.nav-item:hover{background:var(--panel-2);color:var(--text);}
.nav-item.active{background:rgba(99,102,241,.15);color:#c7d2fe;}
.nav-item .ic{width:18px;text-align:center;opacity:.9;}
.sidebar-foot{padding:12px;border-top:1px solid var(--border);}

.main{flex:1;min-width:0;display:flex;flex-direction:column;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid var(--border);background:rgba(18,22,31,.6);backdrop-filter:blur(6px);position:sticky;top:0;z-index:20;}
.topbar h1{font-size:17px;margin:0;font-weight:700;}
.topbar .crumbs{font-size:12px;color:var(--text-faint);margin-top:2px;}
.topbar-right{display:flex;align-items:center;gap:12px;}
.content{padding:24px;flex:1;}

.role-switch{display:flex;align-items:center;gap:8px;background:var(--panel-2);border:1px solid var(--border);border-radius:999px;padding:4px 6px 4px 12px;}
.role-switch select{background:transparent;color:var(--text);border:none;font-size:12.5px;font-weight:600;outline:none;}
.role-switch .dot{width:8px;height:8px;border-radius:50%;background:var(--green);}
.avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}

.div-pill{display:flex;align-items:center;gap:8px;background:var(--panel-2);border:1px solid var(--border);padding:6px 10px;border-radius:999px;font-size:12.5px;color:var(--text-dim);}
.div-pill select{background:transparent;border:none;color:var(--text);font-weight:600;outline:none;font-size:12.5px;}

/* Grid & Cards */
.grid{display:grid;gap:16px;}
.grid-4{grid-template-columns:repeat(4,1fr);}
.grid-3{grid-template-columns:repeat(3,1fr);}
.grid-2{grid-template-columns:repeat(2,1fr);}
@media(max-width:1200px){.grid-4{grid-template-columns:repeat(2,1fr);}.grid-3{grid-template-columns:repeat(2,1fr);}}

.card{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:18px;}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.card-head h3{font-size:14px;margin:0;font-weight:700;}
.card-head .hint{font-size:11.5px;color:var(--text-faint);}

.kpi{padding:16px 18px;}
.kpi .label{font-size:11.5px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;font-weight:600;}
.kpi .value{font-size:26px;font-weight:800;margin-top:8px;letter-spacing:-.02em;}
.kpi .delta{font-size:12px;margin-top:6px;font-weight:600;}
.kpi .delta.up{color:var(--green);}
.kpi .delta.down{color:var(--red);}
.kpi .delta.flat{color:var(--text-faint);}

.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;}
.badge.hot{background:rgba(239,68,68,.15);color:#fca5a5;}
.badge.warm{background:rgba(245,158,11,.15);color:#fcd34d;}
.badge.cold{background:rgba(59,130,246,.15);color:#93c5fd;}
.badge.disqualified{background:rgba(107,115,134,.15);color:var(--text-faint);}
.badge.green{background:rgba(34,197,94,.15);color:#86efac;}
.badge.yellow{background:rgba(245,158,11,.15);color:#fcd34d;}
.badge.red{background:rgba(239,68,68,.15);color:#fca5a5;}
.badge.blue{background:rgba(59,130,246,.15);color:#93c5fd;}
.badge.purple{background:rgba(168,85,247,.15);color:#d8b4fe;}
.badge.gray{background:rgba(107,115,134,.15);color:var(--text-dim);}

.btn{display:inline-flex;align-items:center;gap:6px;background:var(--indigo);color:white;border:none;padding:9px 14px;border-radius:9px;font-size:13px;font-weight:600;transition:background .15s;}
.btn:hover{background:var(--indigo-dim);}
.btn.secondary{background:var(--panel-2);border:1px solid var(--border);color:var(--text);}
.btn.secondary:hover{background:#1e2433;}
.btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text-dim);}
.btn.sm{padding:6px 10px;font-size:12px;}
.btn.danger{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);}
.btn:disabled{opacity:.5;cursor:not-allowed;}

table{width:100%;border-collapse:collapse;}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint);padding:8px 10px;border-bottom:1px solid var(--border);font-weight:600;}
td{padding:11px 10px;border-bottom:1px solid var(--border);font-size:13px;}
tr:last-child td{border-bottom:none;}
tr.row-hover:hover{background:var(--panel-2);}
.table-wrap{overflow-x:auto;}

.progress{height:7px;border-radius:999px;background:var(--panel-2);overflow:hidden;}
.progress > div{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--indigo),var(--blue));}

.tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:18px;}
.tab{padding:9px 14px;font-size:13px;font-weight:600;color:var(--text-faint);border-bottom:2px solid transparent;}
.tab.active{color:var(--text);border-bottom-color:var(--indigo);}
.tab:hover{color:var(--text);}

.input,.select,textarea{background:var(--panel-2);border:1px solid var(--border);color:var(--text);padding:9px 11px;border-radius:8px;font-size:13px;font-family:inherit;outline:none;width:100%;}
.input:focus,.select:focus,textarea:focus{border-color:var(--indigo);}
.field{margin-bottom:14px;}
.field label{display:block;font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:6px;}
.field .help{font-size:11px;color:var(--text-faint);margin-top:4px;}

.modal-backdrop{position:fixed;inset:0;background:rgba(5,7,12,.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:var(--panel);border:1px solid var(--border);border-radius:14px;width:560px;max-width:100%;max-height:88vh;overflow-y:auto;padding:22px;}
.modal h2{margin:0 0 4px;font-size:16px;}
.modal .modal-sub{font-size:12px;color:var(--text-faint);margin-bottom:18px;}
.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid var(--border);}

.toast-host{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:200;}
.toast{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--indigo);padding:12px 16px;border-radius:8px;font-size:13px;max-width:340px;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:slidein .18s ease-out;}
@keyframes slidein{from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}}

/* Kanban */
.kanban{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;}
.kanban-col{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);min-width:250px;flex:1;display:flex;flex-direction:column;max-height:calc(100vh - 210px);}
.kanban-col-head{padding:12px 14px;border-bottom:1px solid var(--border);font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;align-items:center;}
.kanban-col-body{padding:10px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;}
.kanban-card{background:var(--panel-2);border:1px solid var(--border);border-radius:9px;padding:11px 12px;cursor:grab;transition:border-color .12s,transform .12s;}
.kanban-card:hover{border-color:#3a4257;}
.kanban-card.dragging{opacity:.4;}
.kanban-card .title{font-size:13px;font-weight:700;margin-bottom:4px;}
.kanban-card .meta{font-size:11px;color:var(--text-faint);display:flex;justify-content:space-between;align-items:center;margin-top:8px;}
.kanban-col.drag-over{outline:2px dashed var(--indigo);outline-offset:-2px;}

/* Agent feed */
.feed{display:flex;flex-direction:column;gap:2px;max-height:340px;overflow-y:auto;}
.feed-item{display:flex;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border);}
.feed-item:last-child{border-bottom:none;}
.feed-ic{width:28px;height:28px;border-radius:8px;background:var(--panel-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.feed-body .txt{font-size:12.5px;color:var(--text-dim);line-height:1.45;}
.feed-body .txt b{color:var(--text);font-weight:600;}
.feed-body .time{font-size:10.5px;color:var(--text-faint);margin-top:2px;}

.empty{text-align:center;padding:40px 20px;color:var(--text-faint);}
.empty .big{font-size:30px;margin-bottom:10px;}

.division-card{cursor:pointer;transition:border-color .12s;}
.division-card:hover{border-color:#3a4257;}
.division-card .dname{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;}
.division-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--panel-2);}
.tag-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
.tag{background:var(--panel-2);border:1px solid var(--border);padding:3px 8px;border-radius:6px;font-size:10.5px;color:var(--text-dim);}

.section-title{font-size:13px;font-weight:700;color:var(--text-dim);margin:26px 0 12px;text-transform:uppercase;letter-spacing:.06em;}
.muted{color:var(--text-faint);}
.two-col{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;}
@media(max-width:1100px){.two-col{grid-template-columns:1fr;}}

.chip-row{display:flex;gap:6px;flex-wrap:wrap;}
.chip{padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;background:var(--panel-2);border:1px solid var(--border);color:var(--text-dim);}
.chip.active{background:rgba(99,102,241,.18);border-color:var(--indigo);color:#c7d2fe;}

.stat-row{display:flex;gap:22px;flex-wrap:wrap;}
.stat-row .stat .n{font-size:20px;font-weight:800;}
.stat-row .stat .l{font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em;}

.portal-shell{background:var(--bg);}
.portal-topbar{background:linear-gradient(135deg,#1e1b4b,#0b0e14);border-bottom:1px solid var(--border);padding:22px 32px;}
.banner{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:12px 16px;font-size:12.5px;color:#c7d2fe;margin-bottom:18px;}

.score-ring{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0;}

.link-btn{background:none;border:none;color:var(--indigo);font-size:12.5px;font-weight:600;padding:0;}
.link-btn:hover{text-decoration:underline;}

.footer-note{font-size:11px;color:var(--text-faint);text-align:center;padding:18px 0 4px;}
