import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  status?: string;
  tier1Category?: string;
  tier2Category?: string;
}

interface Project {
  id: number;
  name: string;
}

export function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch search results when query changes
  const { data: searchResults = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/tasks/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Fetch projects for displaying project names and project search
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Create a map of project IDs to names
  const projectMap = useMemo(() => {
    const map: Record<number, string> = {};
    projects.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  // Filter projects client-side by search query
  const matchingProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // Escape to close
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleProjectClick = (project: Project) => {
    setIsOpen(false);
    setSearchQuery("");
    setLocation(`/?project=${project.id}`);
  };

  const handleTaskClick = (task: Task) => {
    setIsOpen(false);
    setSearchQuery("");
    setLocation(`/projects/${task.projectId}/tasks/${task.id}`);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasResults = matchingProjects.length > 0 || searchResults.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects & tasks..."
          className={cn(
            "w-48 sm:w-64 pl-9 pr-8 py-1.5 text-sm",
            "border border-gray-200 rounded-lg bg-white",
            "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent",
            "placeholder:text-gray-400"
          )}
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Dropdown results */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto min-w-[280px]">
          {isLoading && !hasResults ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <i className="ri-loader-4-line animate-spin" />
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div>
              {/* Projects section */}
              {matchingProjects.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                    Projects
                  </div>
                  {matchingProjects.slice(0, 5).map((project) => (
                    <button
                      key={`project-${project.id}`}
                      onClick={() => handleProjectClick(project)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className="ri-folder-line text-indigo-500" />
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {highlightMatch(project.name, searchQuery)}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Tasks section */}
              {searchResults.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                    Tasks
                  </div>
                  {searchResults.slice(0, 10).map((task) => (
                    <button
                      key={`task-${task.id}`}
                      onClick={() => handleTaskClick(task)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <i className="ri-task-line text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {highlightMatch(task.title, searchQuery)}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {highlightMatch(task.description.slice(0, 100), searchQuery)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <i className="ri-folder-line" />
                              {projectMap[task.projectId] || `Project #${task.projectId}`}
                            </span>
                            {task.tier2Category && (
                              <span className="flex items-center gap-1">
                                <i className="ri-price-tag-3-line" />
                                {task.tier2Category}
                              </span>
                            )}
                            {task.status && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-xs",
                                  task.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : task.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                                )}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {searchResults.length > 10 && (
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                      Showing first 10 of {searchResults.length} results
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
