type AppTab = 'timer' | 'records'

type BottomTabBarProps = {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
}

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <nav className="bottom-tabbar" aria-label="주요 화면">
      <button
        type="button"
        className={activeTab === 'timer' ? 'tabbar-button active' : 'tabbar-button'}
        onClick={() => onChange('timer')}
      >
        <span>타이머</span>
      </button>
      <button
        type="button"
        className={activeTab === 'records' ? 'tabbar-button active' : 'tabbar-button'}
        onClick={() => onChange('records')}
      >
        <span>기록</span>
      </button>
    </nav>
  )
}
