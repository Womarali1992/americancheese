import { useQuery } from '@tanstack/react-query';
import { Task, Subtask, Material, Contact, Labor, SubtaskComment } from '@shared/schema';
import { ContextData, ContextSection } from '@shared/context-types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ChecklistItem {
  id: number;
  title: string;
  status: string;
  description?: string;
  sortOrder?: number;
}

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  notes?: string;
  createdAt: string;
}

type SubtaskWithComments = Subtask & {
  comments?: SubtaskComment[];
};

interface TaskPageExportData {
  task: Task;
  project?: { id: number; name: string };
  subtasks: SubtaskWithComments[];
  checklistItems: ChecklistItem[];
  laborEntries: Labor[];
  attachments: Attachment[];
  materials: Material[];
  contacts: Contact[];
  projectContext?: ContextData;
}

/**
 * Hook to fetch and aggregate all task page data for export
 */
export function useTaskPageExport(taskId: number, enabled: boolean = true) {
  // Fetch subtasks
  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: enabled && taskId > 0,
  });

  // Fetch all comments for all subtasks in a single query
  // This avoids the React Rules of Hooks violation from dynamic hook calls
  const { data: allSubtaskComments = {} } = useQuery<Record<number, SubtaskComment[]>>({
    queryKey: [`/api/tasks/${taskId}/subtasks/all-comments`, subtasks.map(s => s.id).join(',')],
    queryFn: async () => {
      if (!subtasks || subtasks.length === 0) return {};

      const commentsMap: Record<number, SubtaskComment[]> = {};
      await Promise.all(
        subtasks.map(async (subtask) => {
          try {
            const response = await fetch(`/api/subtasks/${subtask.id}/comments`);
            if (response.ok) {
              commentsMap[subtask.id] = await response.json();
            } else {
              commentsMap[subtask.id] = [];
            }
          } catch {
            commentsMap[subtask.id] = [];
          }
        })
      );
      return commentsMap;
    },
    enabled: enabled && taskId > 0 && subtasks.length > 0,
  });

  // Combine subtasks with their comments
  const subtasksWithComments: SubtaskWithComments[] = subtasks.map((subtask) => ({
    ...subtask,
    comments: allSubtaskComments[subtask.id] || [],
  }));

  // Fetch checklist items
  const { data: checklistItems = [] } = useQuery<ChecklistItem[]>({
    queryKey: [`/api/tasks/${taskId}/checklist`],
    enabled: enabled && taskId > 0,
  });

  // Fetch labor entries
  const { data: laborEntries = [] } = useQuery<Labor[]>({
    queryKey: [`/api/tasks/${taskId}/labor`],
    enabled: enabled && taskId > 0,
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: [`/api/tasks/${taskId}/attachments`],
    enabled: enabled && taskId > 0,
  });

  return {
    subtasks: subtasksWithComments,
    checklistItems,
    laborEntries,
    attachments,
  };
}

/**
 * Format task page data as AI-friendly XML with human-readable markdown content
 */
export function formatTaskPageExport(data: TaskPageExportData): string {
  const lines: string[] = [];

  // XML declaration and root element
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<task-export>');
  lines.push('');

  // Metadata section
  lines.push('<metadata>');
  lines.push(`  <exported-at>${new Date().toISOString()}</exported-at>`);
  lines.push(`  <task-id>${data.task.id}</task-id>`);
  if (data.project) {
    lines.push(`  <project-id>${data.project.id}</project-id>`);
    lines.push(`  <project-name>${escapeXml(data.project.name)}</project-name>`);
  }
  lines.push('</metadata>');
  lines.push('');

  // Task details section
  lines.push('<task>');
  lines.push(`  <title>${escapeXml(data.task.title)}</title>`);
  lines.push(`  <status>${data.task.status || 'not_started'}</status>`);
  if (data.task.tier1Category) {
    lines.push(`  <category tier="1">${escapeXml(data.task.tier1Category)}</category>`);
  }
  if (data.task.tier2Category) {
    lines.push(`  <category tier="2">${escapeXml(data.task.tier2Category)}</category>`);
  }
  lines.push(`  <dates>`);
  lines.push(`    <start>${data.task.startDate}</start>`);
  lines.push(`    <end>${data.task.endDate}</end>`);
  lines.push(`  </dates>`);
  if (data.task.estimatedCost || data.task.actualCost) {
    lines.push(`  <costs>`);
    if (data.task.estimatedCost) lines.push(`    <estimated>${data.task.estimatedCost}</estimated>`);
    if (data.task.actualCost) lines.push(`    <actual>${data.task.actualCost}</actual>`);
    lines.push(`  </costs>`);
  }
  lines.push('</task>');
  lines.push('');

  // Description section with markdown content
  if (data.task.description) {
    lines.push('<description format="markdown">');
    lines.push('<![CDATA[');
    lines.push(data.task.description);
    lines.push(']]>');
    lines.push('</description>');
    lines.push('');
  }

  // AI Context section
  if (data.projectContext?.sections?.length) {
    lines.push('<ai-context>');
    const visibleSections = data.projectContext.sections
      .filter((s: ContextSection) => s.visible)
      .sort((a: ContextSection, b: ContextSection) => a.order - b.order);

    visibleSections.forEach((section: ContextSection) => {
      const tagName = section.type.replace(/_/g, '-');
      lines.push(`  <${tagName} label="${escapeXml(section.label)}">`);

      if (typeof section.content === 'string') {
        if (section.content.trim()) {
          lines.push(`    <![CDATA[${section.content}]]>`);
        }
      } else if (Array.isArray(section.content)) {
        if (section.type === 'casting') {
          (section.content as any[]).forEach((persona: any) => {
            lines.push(`    <persona role="${escapeXml(persona.role || '')}">`);
            lines.push(`      <name>${escapeXml(persona.name)}</name>`);
            if (persona.description) {
              lines.push(`      <description>${escapeXml(persona.description)}</description>`);
            }
            lines.push(`    </persona>`);
          });
        } else {
          (section.content as string[]).forEach((item: string) => {
            lines.push(`    <item>${escapeXml(item)}</item>`);
          });
        }
      }
      lines.push(`  </${tagName}>`);
    });
    lines.push('</ai-context>');
    lines.push('');
  }

  // Contacts section
  if (data.contacts.length > 0) {
    lines.push('<contacts>');
    data.contacts.forEach((contact) => {
      lines.push(`  <contact id="${contact.id}">`);
      lines.push(`    <name>${escapeXml(contact.name)}</name>`);
      if (contact.company) lines.push(`    <company>${escapeXml(contact.company)}</company>`);
      if (contact.role) lines.push(`    <role>${escapeXml(contact.role)}</role>`);
      if (contact.email) lines.push(`    <email>${escapeXml(contact.email)}</email>`);
      if (contact.phone) lines.push(`    <phone>${escapeXml(contact.phone)}</phone>`);
      lines.push(`  </contact>`);
    });
    lines.push('</contacts>');
    lines.push('');
  }

  // Subtasks section
  if (data.subtasks.length > 0) {
    const sortedSubtasks = [...data.subtasks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    lines.push(`<subtasks count="${sortedSubtasks.length}">`);
    sortedSubtasks.forEach((subtask, index) => {
      const completed = subtask.status === 'completed';
      lines.push(`  <subtask id="${subtask.id}" order="${index + 1}" status="${subtask.status}" completed="${completed}">`);
      lines.push(`    <title>${escapeXml(subtask.title)}</title>`);
      if (subtask.description) {
        lines.push(`    <description><![CDATA[${subtask.description}]]></description>`);
      }
      if (subtask.startDate) lines.push(`    <start-date>${subtask.startDate}</start-date>`);
      if (subtask.endDate) lines.push(`    <end-date>${subtask.endDate}</end-date>`);
      if (subtask.assignedTo) lines.push(`    <assigned-to>${escapeXml(subtask.assignedTo)}</assigned-to>`);
      if (subtask.estimatedCost) lines.push(`    <estimated-cost>${subtask.estimatedCost}</estimated-cost>`);
      if (subtask.actualCost) lines.push(`    <actual-cost>${subtask.actualCost}</actual-cost>`);

      // Include subtask comments
      if (subtask.comments && subtask.comments.length > 0) {
        lines.push(`    <comments count="${subtask.comments.length}">`);
        subtask.comments.forEach((comment) => {
          lines.push(`      <comment id="${comment.id}">`);
          lines.push(`        <author>${escapeXml(comment.authorName)}</author>`);
          lines.push(`        <content><![CDATA[${comment.content}]]></content>`);
          if (comment.createdAt) lines.push(`        <created-at>${comment.createdAt}</created-at>`);
          if (comment.updatedAt) lines.push(`        <updated-at>${comment.updatedAt}</updated-at>`);
          lines.push(`      </comment>`);
        });
        lines.push(`    </comments>`);
      }

      lines.push(`  </subtask>`);
    });
    lines.push('</subtasks>');
    lines.push('');
  }

  // Blocker board / checklist items
  if (data.checklistItems.length > 0) {
    lines.push(`<blocker-board count="${data.checklistItems.length}">`);

    // Group by status
    const byStatus: Record<string, ChecklistItem[]> = {};
    data.checklistItems.forEach(item => {
      const status = item.status || 'todo';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(item);
    });

    Object.entries(byStatus).forEach(([status, items]) => {
      lines.push(`  <column status="${status}" count="${items.length}">`);
      items.forEach((item) => {
        lines.push(`    <item id="${item.id}">`);
        lines.push(`      <title>${escapeXml(item.title)}</title>`);
        if (item.description) {
          lines.push(`      <description><![CDATA[${item.description}]]></description>`);
        }
        lines.push(`    </item>`);
      });
      lines.push(`  </column>`);
    });
    lines.push('</blocker-board>');
    lines.push('');
  }

  // Materials section
  if (data.materials.length > 0) {
    lines.push(`<materials count="${data.materials.length}">`);
    data.materials.forEach((material) => {
      lines.push(`  <material id="${material.id}" status="${material.status}">`);
      lines.push(`    <name>${escapeXml(material.name)}</name>`);
      if (material.quantity) lines.push(`    <quantity unit="${escapeXml(material.unit || '')}">${material.quantity}</quantity>`);
      if (material.cost) lines.push(`    <cost>${material.cost}</cost>`);
      if (material.supplier) lines.push(`    <supplier>${escapeXml(material.supplier)}</supplier>`);
      if (material.details) lines.push(`    <details><![CDATA[${material.details}]]></details>`);
      lines.push(`  </material>`);
    });
    lines.push('</materials>');
    lines.push('');
  }

  // Labor section
  if (data.laborEntries.length > 0) {
    lines.push(`<labor count="${data.laborEntries.length}">`);
    data.laborEntries.forEach((labor) => {
      lines.push(`  <entry id="${labor.id}">`);
      lines.push(`    <worker>${escapeXml(labor.fullName)}</worker>`);
      if (labor.company) lines.push(`    <company>${escapeXml(labor.company)}</company>`);
      if (labor.workDescription) lines.push(`    <work-description><![CDATA[${labor.workDescription}]]></work-description>`);
      if (labor.taskDescription) lines.push(`    <task-description><![CDATA[${labor.taskDescription}]]></task-description>`);
      if (labor.totalHours) lines.push(`    <hours>${labor.totalHours}</hours>`);
      if (labor.laborCost) lines.push(`    <cost>${labor.laborCost}</cost>`);
      if (labor.startDate || labor.endDate) {
        lines.push(`    <dates>`);
        if (labor.startDate) lines.push(`      <start>${labor.startDate}</start>`);
        if (labor.endDate) lines.push(`      <end>${labor.endDate}</end>`);
        lines.push(`    </dates>`);
      }
      lines.push(`  </entry>`);
    });
    lines.push('</labor>');
    lines.push('');
  }

  // Attachments section
  if (data.attachments.length > 0) {
    lines.push(`<attachments count="${data.attachments.length}">`);
    data.attachments.forEach((attachment) => {
      lines.push(`  <file id="${attachment.id}" type="${escapeXml(attachment.fileType)}">`);
      lines.push(`    <name>${escapeXml(attachment.fileName)}</name>`);
      if (attachment.notes) lines.push(`    <notes><![CDATA[${attachment.notes}]]></notes>`);
      lines.push(`    <created>${attachment.createdAt}</created>`);
      lines.push(`  </file>`);
    });
    lines.push('</attachments>');
    lines.push('');
  }

  // Human-readable summary at the end (markdown format within XML)
  lines.push('<human-readable format="markdown">');
  lines.push('<![CDATA[');
  lines.push(formatHumanReadableSummary(data));
  lines.push(']]>');
  lines.push('</human-readable>');
  lines.push('');

  lines.push('</task-export>');

  return lines.join('\n');
}

/**
 * Generate a human-readable markdown summary
 */
function formatHumanReadableSummary(data: TaskPageExportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.task.title}`);
  lines.push('');

  // Status and project info
  const statusLabel = (data.task.status || 'not_started').replace('_', ' ').toUpperCase();
  lines.push(`**Status:** ${statusLabel}`);
  if (data.project) {
    lines.push(`**Project:** ${data.project.name}`);
  }
  if (data.task.tier1Category) {
    const category = data.task.tier2Category
      ? `${data.task.tier1Category} > ${data.task.tier2Category}`
      : data.task.tier1Category;
    lines.push(`**Category:** ${category}`);
  }
  lines.push(`**Dates:** ${formatDate(data.task.startDate)} → ${formatDate(data.task.endDate)}`);
  lines.push('');

  // Description
  if (data.task.description) {
    lines.push('## Description');
    lines.push('');
    lines.push(data.task.description);
    lines.push('');
  }

  // Contacts
  if (data.contacts.length > 0) {
    lines.push('## Assigned Contacts');
    lines.push('');
    data.contacts.forEach((contact) => {
      const details = [contact.company, contact.role].filter(Boolean).join(' - ');
      lines.push(`- **${contact.name}**${details ? ` (${details})` : ''}`);
      if (contact.email) lines.push(`  - Email: ${contact.email}`);
      if (contact.phone) lines.push(`  - Phone: ${contact.phone}`);
    });
    lines.push('');
  }

  // Subtasks
  if (data.subtasks.length > 0) {
    const completed = data.subtasks.filter(s => s.status === 'completed').length;
    lines.push(`## Checklist (${completed}/${data.subtasks.length})`);
    lines.push('');
    const sortedSubtasks = [...data.subtasks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    sortedSubtasks.forEach((subtask) => {
      const checkbox = subtask.status === 'completed' ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${subtask.title}`);
      if (subtask.description) {
        lines.push(`  > ${subtask.description.substring(0, 150)}${subtask.description.length > 150 ? '...' : ''}`);
      }
    });
    lines.push('');
  }

  // Blocker board summary
  if (data.checklistItems.length > 0) {
    lines.push('## Blocker Board');
    lines.push('');
    const byStatus: Record<string, ChecklistItem[]> = {};
    data.checklistItems.forEach(item => {
      const status = item.status || 'todo';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(item);
    });

    const statusOrder = ['todo', 'planning', 'preparation', 'execution', 'done'];
    statusOrder.forEach(status => {
      if (byStatus[status]) {
        lines.push(`### ${status.charAt(0).toUpperCase() + status.slice(1)} (${byStatus[status].length})`);
        byStatus[status].forEach(item => {
          lines.push(`- ${item.title}`);
        });
        lines.push('');
      }
    });
  }

  // Materials
  if (data.materials.length > 0) {
    lines.push('## Materials');
    lines.push('');
    lines.push('| Material | Qty | Cost | Supplier | Status |');
    lines.push('|----------|-----|------|----------|--------|');
    data.materials.forEach((m) => {
      const qty = m.quantity ? `${m.quantity}${m.unit ? ' ' + m.unit : ''}` : '-';
      const cost = m.cost ? formatCurrency(m.cost) : '-';
      lines.push(`| ${m.name} | ${qty} | ${cost} | ${m.supplier || '-'} | ${m.status} |`);
    });
    lines.push('');
  }

  // Labor
  if (data.laborEntries.length > 0) {
    lines.push('## Labor');
    lines.push('');
    data.laborEntries.forEach((labor) => {
      const desc = labor.workDescription || labor.taskDescription || 'Work entry';
      lines.push(`- **${labor.fullName}** - ${desc}`);
      if (labor.totalHours) lines.push(`  - Hours: ${labor.totalHours}`);
      if (labor.laborCost) lines.push(`  - Cost: ${formatCurrency(labor.laborCost)}`);
    });
    lines.push('');
  }

  // Attachments
  if (data.attachments.length > 0) {
    lines.push('## Attachments');
    lines.push('');
    data.attachments.forEach((a) => {
      lines.push(`- 📎 **${a.fileName}** (${a.fileType})`);
      if (a.notes) lines.push(`  - ${a.notes}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escape CSV field - wrap in quotes if contains comma, newline, or quotes
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, newline, or double quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Format task page data as CSV for spreadsheet editing
 * Simplified structure: Task row first, then subtask rows
 * Focused on editable content only - no IDs or metadata
 */
export function formatTaskPageExportCSV(data: TaskPageExportData): string {
  const rows: string[][] = [];

  // Header row - simplified to essential editable fields
  const headers = [
    'Type',
    'Title',
    'Description',
    'Status',
    'Order',
    'Comments'
  ];
  rows.push(headers);

  // Task row
  const taskRow = [
    'Task',
    data.task.title,
    data.task.description || '',
    data.task.status || 'not_started',
    '',
    ''
  ];
  rows.push(taskRow);

  // Subtask rows
  const sortedSubtasks = [...data.subtasks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  sortedSubtasks.forEach((subtask, index) => {
    // Combine comments with pipe separator
    const commentsText = subtask.comments?.map(c =>
      `[${c.authorName}] ${c.content.replace(/\|/g, '¦').replace(/\n/g, ' ')}`
    ).join(' | ') || '';

    const subtaskRow = [
      'Subtask',
      subtask.title,
      subtask.description || '',
      subtask.status || 'not_started',
      String(index + 1),
      commentsText
    ];
    rows.push(subtaskRow);
  });

  // Convert rows to CSV string
  return rows.map(row => row.map(escapeCsvField).join(',')).join('\n');
}

/**
 * Export individual sections for granular export
 */
export function formatSectionExport(
  sectionType: 'description' | 'context' | 'contacts' | 'subtasks' | 'blockers' | 'special' | 'resources' | 'materials' | 'labor' | 'attachments',
  data: Partial<TaskPageExportData>
): string {
  const lines: string[] = [];

  switch (sectionType) {
    case 'description':
      if (data.task?.description) {
        lines.push('<description format="markdown">');
        lines.push('<![CDATA[');
        lines.push(data.task.description);
        lines.push(']]>');
        lines.push('</description>');
      }
      break;

    case 'context':
      if (data.projectContext?.sections?.length) {
        lines.push('<ai-context>');
        const visibleSections = data.projectContext.sections
          .filter((s: ContextSection) => s.visible)
          .sort((a: ContextSection, b: ContextSection) => a.order - b.order);

        visibleSections.forEach((section: ContextSection) => {
          const tagName = section.type.replace(/_/g, '-');
          lines.push(`  <${tagName} label="${escapeXml(section.label)}">`);

          if (typeof section.content === 'string') {
            if (section.content.trim()) {
              lines.push(`    <![CDATA[${section.content}]]>`);
            }
          } else if (Array.isArray(section.content)) {
            if (section.type === 'casting') {
              (section.content as any[]).forEach((persona: any) => {
                lines.push(`    <persona role="${escapeXml(persona.role || '')}">`);
                lines.push(`      <name>${escapeXml(persona.name)}</name>`);
                if (persona.description) {
                  lines.push(`      <description>${escapeXml(persona.description)}</description>`);
                }
                lines.push(`    </persona>`);
              });
            } else {
              (section.content as string[]).forEach((item: string) => {
                lines.push(`    <item>${escapeXml(item)}</item>`);
              });
            }
          }
          lines.push(`  </${tagName}>`);
        });
        lines.push('</ai-context>');
      }
      break;

    case 'contacts':
      if (data.contacts && data.contacts.length > 0) {
        lines.push(`<contacts count="${data.contacts.length}">`);
        data.contacts.forEach((contact) => {
          lines.push(`  <contact id="${contact.id}">`);
          lines.push(`    <name>${escapeXml(contact.name)}</name>`);
          if (contact.company) lines.push(`    <company>${escapeXml(contact.company)}</company>`);
          if (contact.role) lines.push(`    <role>${escapeXml(contact.role)}</role>`);
          if (contact.email) lines.push(`    <email>${escapeXml(contact.email)}</email>`);
          if (contact.phone) lines.push(`    <phone>${escapeXml(contact.phone)}</phone>`);
          lines.push(`  </contact>`);
        });
        lines.push('</contacts>');
      }
      break;

    case 'subtasks':
      if (data.subtasks && data.subtasks.length > 0) {
        const sortedSubtasks = [...data.subtasks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const completed = sortedSubtasks.filter(s => s.status === 'completed').length;
        lines.push(`<subtasks count="${sortedSubtasks.length}" completed="${completed}">`);
        sortedSubtasks.forEach((subtask, index) => {
          const isCompleted = subtask.status === 'completed';
          lines.push(`  <subtask id="${subtask.id}" order="${index + 1}" status="${subtask.status}" completed="${isCompleted}">`);
          lines.push(`    <title>${escapeXml(subtask.title)}</title>`);
          if (subtask.description) {
            lines.push(`    <description><![CDATA[${subtask.description}]]></description>`);
          }
          if (subtask.startDate) lines.push(`    <start-date>${subtask.startDate}</start-date>`);
          if (subtask.endDate) lines.push(`    <end-date>${subtask.endDate}</end-date>`);
          if (subtask.assignedTo) lines.push(`    <assigned-to>${escapeXml(subtask.assignedTo)}</assigned-to>`);
          if (subtask.estimatedCost) lines.push(`    <estimated-cost>${subtask.estimatedCost}</estimated-cost>`);
          if (subtask.actualCost) lines.push(`    <actual-cost>${subtask.actualCost}</actual-cost>`);

          // Include subtask comments
          if (subtask.comments && subtask.comments.length > 0) {
            lines.push(`    <comments count="${subtask.comments.length}">`);
            subtask.comments.forEach((comment) => {
              lines.push(`      <comment id="${comment.id}">`);
              lines.push(`        <author>${escapeXml(comment.authorName)}</author>`);
              lines.push(`        <content><![CDATA[${comment.content}]]></content>`);
              if (comment.createdAt) lines.push(`        <created-at>${comment.createdAt}</created-at>`);
              if (comment.updatedAt) lines.push(`        <updated-at>${comment.updatedAt}</updated-at>`);
              lines.push(`      </comment>`);
            });
            lines.push(`    </comments>`);
          }

          lines.push(`  </subtask>`);
        });
        lines.push('</subtasks>');

        // Add markdown summary
        lines.push('');
        lines.push('<!-- Markdown Summary -->');
        lines.push(`## Checklist (${completed}/${sortedSubtasks.length})`);
        sortedSubtasks.forEach((subtask) => {
          const checkbox = subtask.status === 'completed' ? '[x]' : '[ ]';
          lines.push(`- ${checkbox} ${subtask.title}`);
          if (subtask.description) {
            lines.push(`  > ${subtask.description}`);
          }
          // Add comments in markdown
          if (subtask.comments && subtask.comments.length > 0) {
            lines.push(`  **Comments (${subtask.comments.length}):**`);
            subtask.comments.forEach((comment) => {
              lines.push(`  - ${comment.authorName}: ${comment.content}`);
            });
          }
        });
      }
      break;

    case 'blockers':
      if (data.checklistItems && data.checklistItems.length > 0) {
        lines.push(`<blocker-board count="${data.checklistItems.length}">`);
        const byStatus: Record<string, ChecklistItem[]> = {};
        data.checklistItems.forEach(item => {
          const status = item.status || 'todo';
          if (!byStatus[status]) byStatus[status] = [];
          byStatus[status].push(item);
        });

        Object.entries(byStatus).forEach(([status, items]) => {
          lines.push(`  <column status="${status}" count="${items.length}">`);
          items.forEach((item) => {
            lines.push(`    <item id="${item.id}">`);
            lines.push(`      <title>${escapeXml(item.title)}</title>`);
            if (item.description) {
              lines.push(`      <description><![CDATA[${item.description}]]></description>`);
            }
            lines.push(`    </item>`);
          });
          lines.push(`  </column>`);
        });
        lines.push('</blocker-board>');

        // Add markdown summary
        lines.push('');
        lines.push('<!-- Markdown Summary -->');
        lines.push('## Blocker Board');
        const statusOrder = ['todo', 'planning', 'preparation', 'execution', 'done'];
        statusOrder.forEach(status => {
          if (byStatus[status]) {
            lines.push(`### ${status.charAt(0).toUpperCase() + status.slice(1)} (${byStatus[status].length})`);
            byStatus[status].forEach(item => lines.push(`- ${item.title}`));
          }
        });
      }
      break;

    case 'special':
      // Special sections are custom task sections - export a placeholder indicating the section exists
      lines.push('<special-sections>');
      lines.push('  <description>Task-specific special sections with custom workflows</description>');
      lines.push('</special-sections>');
      lines.push('');
      lines.push('<!-- Markdown Summary -->');
      lines.push('## Special Sections');
      lines.push('This task contains special sections for advanced workflow management.');
      break;

    case 'resources':
      // Resources is a container for materials, labor, and attachments
      // Export all three subsections
      if (data.materials && data.materials.length > 0) {
        lines.push(`<materials count="${data.materials.length}">`);
        data.materials.forEach((material) => {
          lines.push(`  <material id="${material.id}" status="${material.status}">`);
          lines.push(`    <name>${escapeXml(material.name)}</name>`);
          if (material.quantity) lines.push(`    <quantity unit="${escapeXml(material.unit || '')}">${material.quantity}</quantity>`);
          if (material.cost) lines.push(`    <cost>${material.cost}</cost>`);
          if (material.supplier) lines.push(`    <supplier>${escapeXml(material.supplier)}</supplier>`);
          lines.push(`  </material>`);
        });
        lines.push('</materials>');
        lines.push('');
      }
      if (data.laborEntries && data.laborEntries.length > 0) {
        lines.push(`<labor count="${data.laborEntries.length}">`);
        data.laborEntries.forEach((labor) => {
          lines.push(`  <entry id="${labor.id}">`);
          lines.push(`    <worker>${escapeXml(labor.fullName)}</worker>`);
          if (labor.totalHours) lines.push(`    <hours>${labor.totalHours}</hours>`);
          if (labor.laborCost) lines.push(`    <cost>${labor.laborCost}</cost>`);
          lines.push(`  </entry>`);
        });
        lines.push('</labor>');
        lines.push('');
      }
      if (data.attachments && data.attachments.length > 0) {
        lines.push(`<attachments count="${data.attachments.length}">`);
        data.attachments.forEach((attachment) => {
          lines.push(`  <file id="${attachment.id}" type="${escapeXml(attachment.fileType)}">`);
          lines.push(`    <name>${escapeXml(attachment.fileName)}</name>`);
          lines.push(`  </file>`);
        });
        lines.push('</attachments>');
      }
      break;

    case 'materials':
      if (data.materials && data.materials.length > 0) {
        lines.push(`<materials count="${data.materials.length}">`);
        data.materials.forEach((material) => {
          lines.push(`  <material id="${material.id}" status="${material.status}">`);
          lines.push(`    <name>${escapeXml(material.name)}</name>`);
          if (material.quantity) lines.push(`    <quantity unit="${escapeXml(material.unit || '')}">${material.quantity}</quantity>`);
          if (material.cost) lines.push(`    <cost>${material.cost}</cost>`);
          if (material.supplier) lines.push(`    <supplier>${escapeXml(material.supplier)}</supplier>`);
          if (material.details) lines.push(`    <details><![CDATA[${material.details}]]></details>`);
          lines.push(`  </material>`);
        });
        lines.push('</materials>');

        // Add markdown table
        lines.push('');
        lines.push('<!-- Markdown Summary -->');
        lines.push('## Materials');
        lines.push('| Material | Qty | Cost | Supplier | Status |');
        lines.push('|----------|-----|------|----------|--------|');
        data.materials.forEach((m) => {
          const qty = m.quantity ? `${m.quantity}${m.unit ? ' ' + m.unit : ''}` : '-';
          const cost = m.cost ? formatCurrency(m.cost) : '-';
          lines.push(`| ${m.name} | ${qty} | ${cost} | ${m.supplier || '-'} | ${m.status} |`);
        });
      }
      break;

    case 'labor':
      if (data.laborEntries && data.laborEntries.length > 0) {
        lines.push(`<labor count="${data.laborEntries.length}">`);
        data.laborEntries.forEach((labor) => {
          lines.push(`  <entry id="${labor.id}">`);
          lines.push(`    <worker>${escapeXml(labor.fullName)}</worker>`);
          if (labor.company) lines.push(`    <company>${escapeXml(labor.company)}</company>`);
          if (labor.workDescription) lines.push(`    <work-description><![CDATA[${labor.workDescription}]]></work-description>`);
          if (labor.totalHours) lines.push(`    <hours>${labor.totalHours}</hours>`);
          if (labor.laborCost) lines.push(`    <cost>${labor.laborCost}</cost>`);
          lines.push(`  </entry>`);
        });
        lines.push('</labor>');

        // Add markdown summary
        lines.push('');
        lines.push('<!-- Markdown Summary -->');
        lines.push('## Labor');
        data.laborEntries.forEach((labor) => {
          const desc = labor.workDescription || labor.taskDescription || 'Work entry';
          lines.push(`- **${labor.fullName}** - ${desc}`);
          if (labor.totalHours) lines.push(`  - Hours: ${labor.totalHours}`);
          if (labor.laborCost) lines.push(`  - Cost: ${formatCurrency(labor.laborCost)}`);
        });
      }
      break;

    case 'attachments':
      if (data.attachments && data.attachments.length > 0) {
        lines.push(`<attachments count="${data.attachments.length}">`);
        data.attachments.forEach((attachment) => {
          lines.push(`  <file id="${attachment.id}" type="${escapeXml(attachment.fileType)}">`);
          lines.push(`    <name>${escapeXml(attachment.fileName)}</name>`);
          if (attachment.notes) lines.push(`    <notes><![CDATA[${attachment.notes}]]></notes>`);
          lines.push(`    <created>${attachment.createdAt}</created>`);
          lines.push(`  </file>`);
        });
        lines.push('</attachments>');

        // Add markdown summary
        lines.push('');
        lines.push('<!-- Markdown Summary -->');
        lines.push('## Attachments');
        data.attachments.forEach((a) => {
          lines.push(`- **${a.fileName}** (${a.fileType})`);
          if (a.notes) lines.push(`  - ${a.notes}`);
        });
      }
      break;
  }

  return lines.join('\n');
}
