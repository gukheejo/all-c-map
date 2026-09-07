import { useState } from 'react';

export default function ExpandableCrewTalk({
  className = '',
  message,
  heading = '크루 TALK',
  headingClassName = '',
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
      <b className={headingClassName || undefined}>{heading}</b>
      <span className="crewtalk-text">{message}</span>
      <span className="sr-only">{expanded ? '접기' : '전체 내용 보기'}</span>
    </button>
  );
}
