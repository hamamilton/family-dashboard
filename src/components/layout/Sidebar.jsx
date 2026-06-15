import React from 'react';
import { 
  ClipboardList, 
  CalendarDays, 
  ShoppingCart, 
  Utensils,
  Star, 
  BookOpen, 
  Settings,
  Smartphone,
  Cpu,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Camera
} from 'lucide-react';
import { WeatherWidget } from '../features/WeatherWidget';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  appTheme, 
  setAppTheme, 
  onAdminClick,
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
  toggleDarkMode
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = async () => {
    try {
      const elem = document.documentElement;
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!fs) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'mission', label: 'Mission Panel', icon: ClipboardList },
    { id: 'schedule', label: 'Master Schedule', icon: CalendarDays },
    { id: 'food', label: 'Meal Planner', icon: Utensils },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
    { id: 'gospel', label: 'Come, Follow Me', icon: BookOpen },
    { id: 'fun', label: 'Fun Stuff', icon: Star },
    { id: 'memories', label: 'Memory Bank', icon: Camera },
  ];

  const themes = [
    { id: 'scifi', label: 'Sci-Fi', icon: Cpu },
    { id: 'ios', label: 'iOS', icon: Smartphone },
    { id: 'android', label: 'Android', icon: MonitorSmartphone },
  ];

  return (
    <div className={`flex flex-col h-full sidebar-root border-r transition-all duration-300 ${isCollapsed ? 'w-[62px]' : 'w-[220px]'}`}>
      {/* Collapse Toggle */}
      <div className={`flex items-center border-b sidebar-border px-3 h-[60px] shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="font-black text-sm text-orange-500 tracking-wider">FamilyHub</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md sidebar-btn transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all text-sm ${
                  activeTab === tab.id 
                    ? 'sidebar-active font-semibold' 
                    : 'sidebar-inactive'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? tab.label : ''}
              >
                <tab.icon size={19} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{tab.label}</span>}
              </button>
            </li>
          ))}
          
          <li className="my-3 border-t sidebar-border mx-1" />

          <li>
            <button
              onClick={onAdminClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg sidebar-inactive transition-all text-sm ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Admin Panel' : ''}
            >
              <Settings size={19} className="shrink-0" />
              {!isCollapsed && <span>Admin Panel</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* Weather Widget — only when expanded */}
      {!isCollapsed && (
        <div className="mx-2 mb-2 px-2 py-2 rounded-md border sidebar-border overflow-hidden">
          <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Weather</div>
          <WeatherWidget compact />
        </div>
      )}

      {/* Controls Row */}
      <div className={`flex border-t sidebar-border px-2 py-2 gap-1.5 ${isCollapsed ? 'flex-col items-center' : 'flex-row items-center'}`}>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md sidebar-btn transition-colors flex-1 flex items-center justify-center"
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-md sidebar-btn transition-colors flex-1 flex items-center justify-center"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* Theme Toggles */}
      <div className="px-2 pb-3 border-t sidebar-border pt-2">
        {!isCollapsed && <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-2 mb-1.5">Theme</div>}
        <ul className={`space-y-0.5 ${isCollapsed ? '' : ''}`}>
          {themes.map(theme => (
            <li key={theme.id}>
              <button
                onClick={() => setAppTheme(theme.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm ${
                  appTheme === theme.id 
                    ? 'sidebar-theme-active' 
                    : 'sidebar-inactive'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? theme.label : ''}
              >
                <theme.icon size={16} className="shrink-0" />
                {!isCollapsed && <span>{theme.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
