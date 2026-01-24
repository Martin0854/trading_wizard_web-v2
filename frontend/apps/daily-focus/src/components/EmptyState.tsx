import './EmptyState.css';

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <h3>오늘은 매수 추천 종목이 없습니다</h3>
      <p>
        현재 볼린저 밴드 스퀴즈 전략 기준을 충족하는 종목이 없습니다.
        <br />
        시장 상황에 따라 추천 종목은 매일 달라질 수 있습니다.
      </p>
      <ul className="tips">
        <li>설정에서 신뢰도 임계값을 조정해보세요</li>
        <li>볼린저 밴드 파라미터를 변경해보세요</li>
        <li>나중에 다시 확인해주세요</li>
      </ul>
    </div>
  );
}

export default EmptyState;
