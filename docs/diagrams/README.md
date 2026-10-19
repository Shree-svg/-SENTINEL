# 📐 SENTINEL — Design Diagrams

This directory contains all system design and architectural diagrams for the SENTINEL cyber-physical gas safety system, provided in both native Mermaid markdown source files and high-resolution exported PNG and vector SVG graphics.

---

## Diagram Index & Asset Catalog

| Section | Markdown Source | Exported PNG Graphic | Vector SVG Graphic | Description |
| :--- | :--- | :--- | :--- | :--- |
| **5.1 System Architecture** | [`5.1_system_architecture.md`](5.1_system_architecture.md) | [`5_1_system_architecture_d1.png`](5_1_system_architecture_d1.png) | [`5_1_system_architecture_d1.svg`](5_1_system_architecture_d1.svg) | Full dual-tier cyber-physical topology: firmware edge plane → ingestion bridge → analytical pipeline → React dashboard. Includes tier summary. |
| **5.2 Use Case Diagram** | [`5.2_use_case_diagram.md`](5.2_use_case_diagram.md) | [`5_2_use_case_diagram_d1.png`](5_2_use_case_diagram_d1.png) | [`5_2_use_case_diagram_d1.svg`](5_2_use_case_diagram_d1.svg) | All 5 system actors (Resident, Caregiver, Admin, Arduino, Demo Simulator) and 27 use cases with relationships. |
| **5.3 Class Diagram** | [`5.3_class_diagram.md`](5.3_class_diagram.md) | [`5_3_class_diagram_d1.png`](5_3_class_diagram_d1.png) | [`5_3_class_diagram_d1.svg`](5_3_class_diagram_d1.svg) | TypeScript interfaces (`Reading`, `Alert`, `Classification`), pipeline classes (`Pipeline`, `Analysis`), React hooks, server classes, and firmware representation. |
| **5.4 Sequence / Activity** | [`5.4_sequence_activity_diagrams.md`](5.4_sequence_activity_diagrams.md) | [`5_4_sequence_activity_diagrams_d1.png`](5_4_sequence_activity_diagrams_d1.png)<br/>[`5_4_sequence_activity_diagrams_d2.png`](5_4_sequence_activity_diagrams_d2.png)<br/>[`5_4_sequence_activity_diagrams_d3.png`](5_4_sequence_activity_diagrams_d3.png)<br/>[`5_4_sequence_activity_diagrams_d4.png`](5_4_sequence_activity_diagrams_d4.png) | [`d1.svg`](5_4_sequence_activity_diagrams_d1.svg)<br/>[`d2.svg`](5_4_sequence_activity_diagrams_d2.svg)<br/>[`d3.svg`](5_4_sequence_activity_diagrams_d3.svg)<br/>[`d4.svg`](5_4_sequence_activity_diagrams_d4.svg) | Four diagrams: (1) Normal telemetry ingestion, (2) Gas leak escalation & acknowledgment, (3) Demo simulator activation activity, (4) Pipeline compensation activity. |
| **5.5 ER Diagram / Data Model** | [`5.5_er_diagram.md`](5.5_er_diagram.md) | [`5_5_er_diagram_d1.png`](5_5_er_diagram_d1.png)<br/>[`5_5_er_diagram_d2.png`](5_5_er_diagram_d2.png) | [`d1.svg`](5_5_er_diagram_d1.svg)<br/>[`d2.svg`](5_5_er_diagram_d2.svg) | Entity-relationship model of all runtime data structures, in-memory circular ring buffer schemas, and empirical CSV dataset schema. |
| **5.6 UI Wireframes** | [`5.6_ui_wireframes.md`](5.6_ui_wireframes.md) | [`5_6_ui_wireframes_d1.png`](5_6_ui_wireframes_d1.png)<br/>[`5_6_ui_wireframes_d2.png`](5_6_ui_wireframes_d2.png) | [`d1.svg`](5_6_ui_wireframes_d1.svg)<br/>[`d2.svg`](5_6_ui_wireframes_d2.svg) | Navigation map and ASCII wireframes for all 5 dashboard screens (`/monitor`, `/alerts`, `/caregiver`, `/admin`, `/settings`), demo simulator panel, and color legend. |

---

> All markdown diagrams use [Mermaid](https://mermaid.js.org/) syntax and render natively on GitHub. High-resolution raster PNG and scalable vector SVG exports are preserved for academic paper formatting and PDF generation.
