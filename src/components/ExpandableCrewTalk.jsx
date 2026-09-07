import { useState } from 'react';

export default function ExpandableCrewTalk({
  className = '',
  label = '크루TALK',
  message,
  expanded: controlledExpanded,
  onToggle,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = typeof controlledExpanded === 'boolean' ? controlledExpanded : internalExpanded;

  function handleToggle() {
    if (typeof controlledExpanded !== 'boolean') setInternalExpanded((current) => !current);
    onToggle?.();
  }

  return (
    <button
      type="button"
      className={`expandable-crewtalk${expanded ? ' expanded' : ''}${className ? ` ${className}` : ''}`}
      aria-expanded={expanded}
      onClick={handleToggle}
    >
      <b>{label}</b>
      <span className="crewtalk-text">{message}</span>
      <span className="sr-only">{expanded ? '접기' : '전체 내용 보기'}</span>
    </button>
  );
}
