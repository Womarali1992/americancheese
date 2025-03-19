export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "border-green-500"
    case "in_progress":
    case "in progress":
      return "border-blue-500"
    case "not_started":
    case "not started":
    case "pending":
      return "border-orange-500"
    case "delayed":
    case "on_hold":
    case "on hold":
      return "border-red-500"
    default:
      return "border-gray-500"
  }
}

export function getStatusBgColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in_progress":
    case "in progress":
      return "bg-blue-100 text-blue-800"
    case "not_started":
    case "not started":
    case "pending":
      return "bg-orange-100 text-orange-800"
    case "delayed":
    case "on_hold":
    case "on hold":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getProgressColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-500 h-2 rounded-full"
    case "in_progress":
    case "in progress":
      return "bg-blue-500 h-2 rounded-full"
    case "not_started":
    case "not started":
    case "pending":
      return "bg-orange-500 h-2 rounded-full"
    case "delayed":
    case "on_hold":
    case "on hold":
      return "bg-red-500 h-2 rounded-full"
    default:
      return "bg-gray-500 h-2 rounded-full"
  }
}

export function formatTaskStatus(status: string): string {
  // Convert snake_case or any other format to Title Case with spaces
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}