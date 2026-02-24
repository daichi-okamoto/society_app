import { useEffect, useRef, useState } from "react";

export const sortOptions = {
  latest: "最新順",
  oldest: "古い順",
  members: "メンバー数順",
};

export default function TeamSortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="adteam-sort" ref={rootRef}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} aria-expanded={open}>
        {sortOptions[value]}
        <span className="material-symbols-outlined">expand_more</span>
      </button>
      {open ? (
        <div className="adteam-sort-menu">
          {Object.entries(sortOptions).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={value === key ? "active" : ""}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
