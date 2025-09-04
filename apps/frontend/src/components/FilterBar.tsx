'use client'

import { useState } from 'react'
import { 
  useDeviceStore, 
  useDeviceFilters, 
  useDeviceSort, 
  useDeviceView, 
  useDeviceStats,
  FilterStatus,
  SortBy,
  ViewMode
} from '@/store/useDeviceStore'

export function FilterBar() {
  const filters = useDeviceFilters()
  const { sortBy, sortDirection } = useDeviceSort()
  const view = useDeviceView()
  const stats = useDeviceStats()
  
  const {
    setStatusFilter,
    setSearchFilter,
    setSortBy,
    setSortDirection,
    setView,
    resetFilters
  } = useDeviceStore()
  
  const [searchValue, setSearchValue] = useState(filters.search)

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    const timeoutId = setTimeout(() => {
      setSearchFilter(value)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  // Status filter buttons configuration
  const statusFilters: Array<{
    key: FilterStatus
    label: string
    count: number
    color: string
    bgColor: string
    borderColor: string
  }> = [
    {
      key: 'all',
      label: 'All',
      count: stats.total,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    },
    {
      key: 'normal',
      label: 'Normal',
      count: stats.normal,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      key: 'warning',
      label: 'Warning',
      count: stats.warning,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      key: 'critical',
      label: 'Critical',
      count: stats.critical,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ]

  // Sort options configuration
  const sortOptions: Array<{ key: SortBy; label: string; icon: string }> = [
    { key: 'name', label: 'Name', icon: '🏷️' },
    { key: 'temperature', label: 'Temperature', icon: '🌡️' },
    { key: 'battery', label: 'Battery', icon: '🔋' },
    { key: 'location', label: 'Location', icon: '📍' }
  ]

  // View options configuration
  const viewOptions: Array<{ key: ViewMode; label: string; icon: string }> = [
    { key: 'grid', label: 'Grid', icon: '▦' },
    { key: 'list', label: 'List', icon: '☰' },
    { key: 'map', label: 'Map', icon: '🗺️' }
  ]

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Top Row: Status Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Filter by status:</span>
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.status === filter.key
                  ? `${filter.bgColor} ${filter.color} ${filter.borderColor} ring-2 ring-opacity-50`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                  filters.status === filter.key ? 'bg-white bg-opacity-80' : 'bg-gray-100'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
          
          {/* Reset Filters Button */}
          {(filters.status !== 'all' || filters.search) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative lg:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search devices..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Bottom Row: Sort and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          
          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Sort Direction Toggle */}
          <button
            onClick={toggleSortDirection}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortDirection === 'asc' ? (
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {viewOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setView(option.key)}
                className={`
                  px-3 py-2 text-sm font-medium transition-colors
                  ${view === option.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
                title={option.label}
              >
                <span className="mr-1">{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {filters.search && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing results for "<span className="font-medium">{filters.search}</span>"
            {filters.status !== 'all' && (
              <> filtered by <span className="font-medium">{filters.status}</span> status</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}