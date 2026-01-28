-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Materials
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);

-- Labor
CREATE INDEX IF NOT EXISTS idx_labor_project_id ON labor(project_id);
CREATE INDEX IF NOT EXISTS idx_labor_task_id ON labor(task_id);
CREATE INDEX IF NOT EXISTS idx_labor_contact_id ON labor(contact_id);

-- Subtasks
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task_id ON subtasks(parent_task_id);

-- Project categories
CREATE INDEX IF NOT EXISTS idx_project_categories_project_id ON project_categories(project_id);

-- Invoice line items
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- Checklist items
CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id);
