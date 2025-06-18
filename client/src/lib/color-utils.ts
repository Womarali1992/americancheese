// Admin Panel Color System - Single Source of Truth for All Colors
import { 
  getStatusBorderColor as getAdminStatusBorderColor,
  getStatusBgColor as getAdminStatusBgColor,
  getProgressColor as getAdminProgressColor,
  getColorByModule as getAdminColorByModule,
  getCategoryColorClasses as getAdminCategoryColorClasses,
  getTier1CategoryColorClasses,
  getTier2CategoryColorClasses,
  getThemeTaskCardColors as getAdminThemeTaskCardColors,
  getCategoryColorValues as getAdminCategoryColorValues,
  formatStatusText as formatStatusTextUtil,
  formatTaskStatus as formatTaskStatusUtil,
  formatCategoryName as formatCategoryNameUtil
} from './unified-color-utils';

// All color functions now delegate to admin panel color system
export const getStatusBorderColor = getAdminStatusBorderColor;
export const getStatusBgColor = getAdminStatusBgColor;
export const getProgressColor = getAdminProgressColor;
export const getColorByModule = getAdminColorByModule;
export const getCategoryColor = getAdminCategoryColorClasses;
export const getTier1CategoryColor = getTier1CategoryColorClasses;
export const getTier2CategoryColor = getTier2CategoryColorClasses;
export const getThemeTaskCardColors = getAdminThemeTaskCardColors;
export const getCategoryColorValues = getAdminCategoryColorValues;

// Text formatting functions
export const formatStatusText = formatStatusTextUtil;
export const formatTaskStatus = formatTaskStatusUtil;
export const formatCategoryName = formatCategoryNameUtil;

// Legacy alias for backward compatibility
export const getStatusColor = getStatusBgColor;