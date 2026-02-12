import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { NavProvider, useNav } from '@/contexts/NavContext';
import type { NavPillData } from '@/contexts/NavContext';

// Stub icon component for test pill data
function StubIcon({ className }: { className?: string }) {
  return <span className={className}>icon</span>;
}

function buildTestPill(overrides: Partial<NavPillData> = {}): NavPillData {
  return {
    id: 'tasks',
    icon: StubIcon,
    count: 5,
    label: 'Tasks',
    navigateTo: '/tasks',
    color: '#3b82f6',
    isActive: false,
    ...overrides,
  };
}

describe('NavContext', () => {
  it('provides empty defaults', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavProvider>{children}</NavProvider>
    );

    const { result } = renderHook(() => useNav(), { wrapper });

    expect(result.current.pills).toEqual([]);
    expect(result.current.actions).toBeNull();
  });

  it('setPills updates pill data', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavProvider>{children}</NavProvider>
    );

    const { result } = renderHook(() => useNav(), { wrapper });

    const testPills: NavPillData[] = [
      buildTestPill({ id: 'tasks', label: 'Tasks', count: 12 }),
      buildTestPill({ id: 'materials', label: 'Materials', count: 3, color: '#10b981' }),
    ];

    act(() => {
      result.current.setPills(testPills);
    });

    expect(result.current.pills).toHaveLength(2);
    expect(result.current.pills[0].id).toBe('tasks');
    expect(result.current.pills[0].count).toBe(12);
    expect(result.current.pills[1].id).toBe('materials');
    expect(result.current.pills[1].label).toBe('Materials');
  });

  it('setActions updates action content', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavProvider>{children}</NavProvider>
    );

    const { result } = renderHook(() => useNav(), { wrapper });

    const actionNode = <button type="button">Add Task</button>;

    act(() => {
      result.current.setActions(actionNode);
    });

    expect(result.current.actions).not.toBeNull();
  });

  it('context resets when provider unmounts', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavProvider>{children}</NavProvider>
    );

    // First mount: set some state
    const { result, unmount } = renderHook(() => useNav(), { wrapper });

    act(() => {
      result.current.setPills([buildTestPill()]);
      result.current.setActions(<span>action</span>);
    });

    expect(result.current.pills).toHaveLength(1);

    // Unmount the first provider
    unmount();

    // Second mount: a fresh provider should have defaults
    const { result: freshResult } = renderHook(() => useNav(), { wrapper });

    expect(freshResult.current.pills).toEqual([]);
    expect(freshResult.current.actions).toBeNull();
  });
});
