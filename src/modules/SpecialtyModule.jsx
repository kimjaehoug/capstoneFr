function SpecialtyModule({ moduleDef, note, onNoteChange }) {
  return (
    <div>
      <p className="section-note specialty-module-lead">{moduleDef.description}</p>
      <div className="form-field specialty-note-field">
        <label htmlFor={`specialty-note-${moduleDef.id}`}>작업 메모</label>
        <textarea
          id={`specialty-note-${moduleDef.id}`}
          rows={8}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="규칙 초안, 검토 포인트, 외부 시스템 연계 조건 등을 적어 둡니다."
        />
      </div>
    </div>
  );
}

export default SpecialtyModule;
