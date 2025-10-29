// Updated to use the new simplified theme system with backward compatibility
import * as themeCompat from './theme-compat';

// Export all compatibility functions
export const {
  getStatusBorderColor,
  getStatusBgColor,
  getProgressColor,
  getTier1CategoryColor,
  getTier2CategoryColor,
  getThemeTier1CategoryColor,
  getThemeTier2CategoryColor,
  formatTaskStatus,
  formatCategoryName,
  getCategoryColorUnified,
  getColorByModule,
  getCategoryColorValues,
  getTier1CategoryColorClasses,
  getTier2CategoryColorClasses,
  getCategoryColorClasses,
  getStatusColor,
  formatStatusText,
  getThemeTaskCardColors,
  getGenericCategoryColor,
  getTaskCategoryColor,
  getCategoryBadgeClasses
} = themeCompat;

// Main category color function
export const getCategoryColor = themeCompat.getCategoryColor;