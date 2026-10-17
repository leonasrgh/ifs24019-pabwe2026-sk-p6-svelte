const TYPE_LABELS = {
  public: "Publik",
  unlisted: "Unlisted",
  private: "Privat",
};

const TYPE_CLASSES = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  unlisted: "bg-amber-50 text-amber-700 border-amber-200/60",
  private: "bg-slate-100 text-slate-700 border-slate-200",
};

export function typeLabel(type) {
  return TYPE_LABELS[type] || type || "-";
}

export function typeClass(type) {
  return TYPE_CLASSES[type] || TYPE_CLASSES.private;
}
