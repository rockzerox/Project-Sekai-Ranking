import React from 'react';
import { CHARACTERS } from './constants';
import { UI_TEXT } from './uiText';
import { ViewType } from '../types';

export interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  charColor: string;
}

export interface NavGroup {
  category: string;
  color: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    category: UI_TEXT.sidebar.categories.ranking,
    color: "#4455DD",
    items: [
      { id: 'live', label: UI_TEXT.sidebar.items.live, charColor: CHARACTERS['1'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
      { id: 'past', label: UI_TEXT.sidebar.items.past, charColor: CHARACTERS['2'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { id: 'distribution', label: UI_TEXT.sidebar.items.distribution, charColor: CHARACTERS['3'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.analysis,
    color: "#88DD44",
    items: [
      { id: 'comparison', label: UI_TEXT.sidebar.items.comparison, charColor: CHARACTERS['5'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 18l4-6 4 4 10-10 M3 14l4-6 4 4 10-10" /></svg> },
      { id: 'analysis', label: UI_TEXT.sidebar.items.analysis, charColor: CHARACTERS['6'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 20v-4h3v4M11 20v-8h3v8M16 20v-13h3v13" /></svg> },
      { id: 'trend', label: UI_TEXT.sidebar.items.trend, charColor: CHARACTERS['7'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.character,
    color: "#EE1166",
    items: [
      { id: 'worldLink', label: UI_TEXT.sidebar.items.worldLink, charColor: CHARACTERS['9'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { id: 'unitAnalysis', label: UI_TEXT.sidebar.items.unitAnalysis, charColor: "#00BBDD", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
      { id: 'characterAnalysis', label: UI_TEXT.sidebar.items.characterAnalysis, charColor: "#FF7722", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.player,
    color: "#FF9900",
    items: [
      { id: 'playerAnalysis', label: UI_TEXT.sidebar.items.playerAnalysis, charColor: CHARACTERS['13'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      { id: 'playerStructure', label: UI_TEXT.sidebar.items.playerStructure, charColor: CHARACTERS['14'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
      { id: 'playerProfile', label: UI_TEXT.sidebar.items.playerProfile, charColor: CHARACTERS['15'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M7 10h2 M7 14h6" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.tools,
    color: "#884499",
    items: [
      { id: 'resourceEstimator', label: UI_TEXT.sidebar.items.resourceEstimator, charColor: CHARACTERS['17'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
      { id: 'mySekaiMining', label: UI_TEXT.sidebar.items.mySekaiMining, charColor: '#8888CC', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
      { id: 'eventSongs', label: UI_TEXT.sidebar.items.eventSongs, charColor: CHARACTERS['20'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
    ]
  }
];
