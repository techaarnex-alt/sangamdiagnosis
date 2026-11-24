import React from 'react';
import LegacyWorkflowFrame from '../components/LegacyWorkflowFrame/LegacyWorkflowFrame';
import { legacyWorkflow } from '../config/legacyWorkflow';
import './App.css';

export default function App() {
  return (
    <main className="sangam-app">
      <LegacyWorkflowFrame {...legacyWorkflow} />
    </main>
  );
}
