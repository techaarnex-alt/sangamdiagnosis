import React from 'react';
import './LegacyWorkflowFrame.css';

export default function LegacyWorkflowFrame({ src, title, sections }) {
  return (
    <iframe
      className="legacy-workflow-frame"
      src={src}
      title={title}
      aria-label={`${title}: ${sections.map(({ label }) => label).join(', ')}`}
    />
  );
}
