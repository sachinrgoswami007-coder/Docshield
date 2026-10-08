# Docshield.

> Intelligent, privacy-focused document verification, security, and analysis platform.

Docshield is a modern web application designed to inspect, secure, and manage sensitive documents.
Built for speed and reliability, it provides intuitive workflows for validating file integrity, tamper detection, and structured document insights.

---

## ✨ Features

- Document Integrity & Tamper Check: Fast client-side and server-assisted verification of document authenticity.
- Privacy-First Architecture: Ensures sensitive document data remains secure throughout upload and inspection.
- Real-Time Analysis: Visual feedback, progress indicators, and actionable status reports.
- Modular Component Design: Built with accessible UI components powered by Radix UI and Tailwind CSS.
- Type-Safe & Fast: End-to-end TypeScript support with sub-second HMR via Vite.

---

## 🛠️ Tech Stack

- Framework: React 18 / Vite
- Language: TypeScript
- Styling: Tailwind CSS, shadcn/ui, Lucide Icons
- Testing: Vitest
- Package Manager / Runtime:** Bun & npm


---

## 📁 Project Structure

```text
Docshield/
├── public/              # Static assets and icons
├── src/                 # Application source code
│   ├── components/      # Reusable UI and layout components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and shared helpers
│   ├── pages/           # Application views and route screens
│   ├── App.tsx          # Root application component
│   └── main.tsx         # Application entry point
├── components.json      # shadcn/ui configuration
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest testing suite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project metadata and dependencies
