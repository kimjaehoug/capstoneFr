function AppModals({
  isCopiedModalOpen,
  copiedTitle,
  onConfirmCopied,
  onCloseCopied,
  isPipelineDeleteModalOpen,
  pipelineToDelete,
  onConfirmPipelineDelete,
  onClosePipelineDelete,
  isDataDeleteModalOpen,
  dataSourceToDelete,
  onConfirmDataDelete,
  onCloseDataDelete,
}) {
  return (
    <>
      {isCopiedModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>알림</h3>
            <p>
              <strong>"{copiedTitle}"</strong>이 복사되었습니다.
              <br />
              '내 파이프라인' 메뉴에서 확인하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="btn-modal-primary" onClick={onConfirmCopied}>예</button>
              <button className="btn-modal-secondary" onClick={onCloseCopied}>아니오</button>
            </div>
          </div>
        </div>
      ) : null}

      {isPipelineDeleteModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>파이프라인 삭제</h3>
            <p>
              <strong>"{pipelineToDelete?.title}"</strong>
              <br />
              이 파이프라인을 정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="btn-modal-delete-primary" onClick={onConfirmPipelineDelete}>삭제하기</button>
              <button className="btn-modal-secondary" onClick={onClosePipelineDelete}>취소</button>
            </div>
          </div>
        </div>
      ) : null}

      {isDataDeleteModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>데이터 삭제</h3>
            <p>
              <strong>"{dataSourceToDelete?.name}"</strong>
              <br />
              이 데이터셋을 정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="btn-modal-delete-primary" onClick={onConfirmDataDelete}>삭제하기</button>
              <button className="btn-modal-secondary" onClick={onCloseDataDelete}>취소</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default AppModals;
