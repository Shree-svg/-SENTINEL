# 📐 SENTINEL — Design Diagrams

This directory contains all system design and architectural diagrams for the SENTINEL cyber-physical gas safety system.

---

## Diagram Index

| File | Section | Description |
| :--- | :--- | :--- |
| [5.1_system_architecture.md](5.1_system_architecture.md) | **5.1 System Architecture** | Full dual-tier cyber-physical topology: firmware edge plane → ingestion bridge → analytical pipeline → React dashboard. Includes architectural tier summary table. |
| [5.2_use_case_diagram.md](5.2_use_case_diagram.md) | **5.2 Use Case Diagram** | All 5 system actors (Resident, Caregiver, Admin, Arduino, Demo Simulator) and 27 use cases with relationships. |
| [5.3_class_diagram.md](5.3_class_diagram.md) | **5.3 Class Diagram** | TypeScript interfaces (`Reading`, `Alert`, `Classification`, `NotificationSettings`), pipeline classes (`Pipeline`, `Analysis`, `Counters`), React hooks, server classes, and firmware representation. |
| [5.4_sequence_activity_diagrams.md](5.4_sequence_activity_diagrams.md) | **5.4 Sequence / Activity Diagrams** | Four diagrams: (1) Normal telemetry ingestion, (2) Gas leak escalation & acknowledgment, (3) Demo simulator activation activity, (4) Pipeline compensation activity. |
| [5.5_er_diagram.md](5.5_er_diagram.md) | **5.5 ER Diagram / Data Design** | Entity-relationship model of all runtime data structures, in-memory server state schema, and empirical CSV dataset schema. |
| [5.6_ui_wireframes.md](5.6_ui_wireframes.md) | **5.6 UI Design / Wireframes** | ASCII wireframes for all 5 dashboard screens (/monitor, /alerts, /caregiver, /admin, /settings), demo simulator panel, and color legend. |

---

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax and render natively on GitHub.
