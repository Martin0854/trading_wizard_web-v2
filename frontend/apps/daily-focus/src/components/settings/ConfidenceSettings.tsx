import type { DailyFocusSettings } from '@trading-wizard/shared-ui/types';
import './SettingsForm.css';

interface ConfidenceSettingsProps {
  settings: DailyFocusSettings;
  onChange: (settings: Partial<DailyFocusSettings>) => void;
}

function ConfidenceSettings({ settings, onChange }: ConfidenceSettingsProps) {
  const getThresholdLabel = (value: number) => {
    if (value >= 75) return '매우 엄격';
    if (value >= 60) return '엄격';
    if (value >= 45) return '보통';
    if (value >= 30) return '관대';
    return '매우 관대';
  };

  return (
    <div className="settings-group">
      <h3>신뢰도 설정</h3>
      <p className="group-description">
        매수 추천 신호의 신뢰도 임계값을 설정합니다.
        높을수록 더 엄격한 기준이 적용됩니다.
      </p>

      <div className="form-field slider-field">
        <label htmlFor="confidenceThreshold">
          신뢰도 임계값: {settings.confidenceThreshold}점
          <span className="threshold-label">({getThresholdLabel(settings.confidenceThreshold)})</span>
        </label>
        <input
          type="range"
          id="confidenceThreshold"
          value={settings.confidenceThreshold}
          onChange={(e) =>
            onChange({ confidenceThreshold: parseInt(e.target.value, 10) })
          }
          min={0}
          max={100}
          step={5}
        />
        <div className="slider-labels">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
        <span className="field-hint">
          신뢰도 점수가 이 값 이상인 종목만 추천 목록에 표시됩니다. (기본: 55)
        </span>
      </div>

      <div className="score-breakdown">
        <h4>신뢰도 점수 구성</h4>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>최대 점수</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>볼린저 돌파</td>
              <td>25점</td>
              <td>상단 밴드 돌파 시 기본 부여</td>
            </tr>
            <tr>
              <td>거래량</td>
              <td>25점</td>
              <td>평균 대비 2배 이상에서 만점</td>
            </tr>
            <tr>
              <td>RSI</td>
              <td>20점</td>
              <td>50 근처에서 만점, 30/70에서 0점</td>
            </tr>
            <tr>
              <td>MACD</td>
              <td>30점</td>
              <td>히스토그램이 시그널 대비 강할수록 높은 점수</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>합계</strong></td>
              <td><strong>100점</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default ConfidenceSettings;
