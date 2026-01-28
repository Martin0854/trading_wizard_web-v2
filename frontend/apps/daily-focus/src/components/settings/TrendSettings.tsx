import type { DailyFocusSettings } from '@trading-wizard/shared-ui/types';
import './SettingsForm.css';

interface TrendSettingsProps {
    settings: DailyFocusSettings;
    onChange: (settings: Partial<DailyFocusSettings>) => void;
}

function TrendSettings({ settings, onChange }: TrendSettingsProps) {
    return (
        <div className="settings-group">
            <h3>추세 판단 설정</h3>
            <p className="group-description">
                볼린저 밴드 돌파 시 가산점 부여를 위한 추세 판단 기준을 설정합니다.
                <br />
                (수축 + 조정/하락 추세가 모두 충족될 때 +20점 추가)
            </p>

            <div className="form-section">
                <h4>추세 분석 기간</h4>
                <div className="form-row">
                    <div className="form-field">
                        <label htmlFor="trendLookbackDays">조회 기간 (일)</label>
                        <input
                            type="number"
                            id="trendLookbackDays"
                            value={settings.trendLookbackDays}
                            onChange={(e) =>
                                onChange({ trendLookbackDays: parseInt(e.target.value, 10) || 20 })
                            }
                            min={5}
                            max={60}
                        />
                        <span className="field-hint">최근 N일 동안의 추세를 분석 (5-60, 기본: 20)</span>
                    </div>
                    <div className="form-field">
                        <label htmlFor="trendBelowMaThreshold">이평선 하회 최소 일수</label>
                        <input
                            type="number"
                            id="trendBelowMaThreshold"
                            value={settings.trendBelowMaThreshold}
                            onChange={(e) =>
                                onChange({ trendBelowMaThreshold: parseInt(e.target.value, 10) || 15 })
                            }
                            min={1}
                            max={60}
                        />
                        <span className="field-hint">해당 기간 중 이평선 아래에 있어야 하는 최소 일수 (1-60, 기본: 15)</span>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4>이평선 기울기</h4>
                <div className="form-field">
                    <label htmlFor="trendMaSlopeLookback">비교 시점 (일)</label>
                    <input
                        type="number"
                        id="trendMaSlopeLookback"
                        value={settings.trendMaSlopeLookback}
                        onChange={(e) =>
                            onChange({ trendMaSlopeLookback: parseInt(e.target.value, 10) || 10 })
                        }
                        min={1}
                        max={30}
                    />
                    <span className="field-hint">현재 이평선 값과 N일 전 값을 비교하여 기울기 판단 (1-30, 기본: 10)</span>
                </div>
            </div>
        </div>
    );
}

export default TrendSettings;
