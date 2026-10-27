import React, { useState } from 'react';
import {
  Zap,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { UserRole } from '../types/index.js';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: () => void;
}

export default function Navbar({ currentTab, onTabChange, onOpenAuth }: NavbarProps) {
  const { user, logout, switchDemoRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    consumer: 'Consumer (Citizen)',
    local_admin: 'Local Admin (Panchayat/JE)',
    district_admin: 'District Admin (Nodal Officer)',
    state_admin: 'State Admin (Commissioner)',
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setShowRoleMenu(false);
    await switchDemoRole(role);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <div
          onClick={() => onTabChange('landing')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            BijliWatch
          </span>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onTabChange('landing')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'landing' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onTabChange('tracker')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'tracker' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Public Tracker
          </button>
          <button
            onClick={() => onTabChange('tariff')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'tariff' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Tariff Estimator
          </button>
          <button
            onClick={() => onTabChange(user?.role === 'consumer' ? 'user_dashboard' : 'admin_dashboard')}
            className={`whitespace-nowrap transition-colors ${
              currentTab === 'user_dashboard' || currentTab === 'admin_dashboard'
                ? 'text-cyan-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {user?.role === 'consumer' ? 'My Dashboard' : 'Admin Portal'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action / User profile & Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-semibold text-slate-200">System Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                            : 'bg-cyan-950/20 border-cyan-500/30 text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-cyan-300 truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-medium">
                {user ? roleLabels[user.role] : 'Select Demo Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800">
                  Switch Active Role
                </div>
                {(['consumer', 'local_admin', 'district_admin', 'state_admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      user?.role === r
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {user?.role === r && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Sign In / Profile Button */}
          {user ? (
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-400/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
