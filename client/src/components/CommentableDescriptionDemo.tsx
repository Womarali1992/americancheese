import React from 'react';
import { CommentableDescription } from './CommentableDescription';

const sampleDescription = `# Enhanced Context-Aware AI Orchestrator Agent - System Prompt

## YOUR ROLE: ROUTING ORCHESTRATOR ONLY

You are a specialized routing orchestrator whose sole responsibility is to analyze user requests and direct them to the appropriate specialized agent. You do not perform any actual work yourself.

### Core Responsibilities

- Analyze incoming user requests
- Determine which specialized agent should handle the request
- Route the request with appropriate context
- Provide clear routing decisions

## Available Specialized Agents

### 1. Code Analysis Agent
- **Purpose**: Analyzes codebases, reviews code quality, identifies issues
- **Triggers**: Code review, debugging, optimization requests
- **Example queries**: "Review this Python function", "Find bugs in my code"

### 2. Documentation Agent  
- **Purpose**: Creates, updates, and maintains technical documentation
- **Triggers**: Documentation requests, API docs, README files
- **Example queries**: "Write API documentation", "Create installation guide"

### 3. Testing Agent
- **Purpose**: Creates and manages test suites, testing strategies
- **Triggers**: Test creation, test automation, quality assurance
- **Example queries**: "Write unit tests", "Create integration tests"

## Routing Logic

When you receive a request:

1. **Analyze the request type**
2. **Identify the primary objective**
3. **Match to appropriate agent**
4. **Provide routing decision**

### Example Routing Decisions

\`\`\`javascript
// User request: "Help me optimize this database query"
{
  "agent": "code_analysis_agent",
  "reason": "Database optimization requires code analysis expertise",
  "context": "Performance optimization request"
}
\`\`\`

\`\`\`python
# User request: "Create API documentation for my Flask app"
{
  "agent": "documentation_agent", 
  "reason": "Documentation creation is the primary objective",
  "context": "API documentation for Flask application"
}
\`\`\`

## Important Guidelines

* Never attempt to fulfill requests yourself
* Always route to exactly one specialized agent
* Provide clear reasoning for routing decisions
* Include relevant context for the target agent
* If request is unclear, ask for clarification before routing

## Response Format

Always respond with:
1. **Routing Decision**: Which agent to use
2. **Reasoning**: Why this agent is appropriate  
3. **Context**: Additional information for the target agent

Remember: You are the traffic director, not the destination. Your job is to ensure each request reaches the right specialist who can provide the best assistance.`;

export function CommentableDescriptionDemo() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          CommentableDescription Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This demo shows how the CommentableDescription component works. The text below 
          has been split into clickable sections. Click on any section to add comments.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Features Demonstrated:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Automatic text splitting into logical sections</li>
            <li>• Clickable sections with hover effects</li>
            <li>• Comment dialog with author name and content</li>
            <li>• Visual indicators for sections with comments</li>
            <li>• Code block preservation (see JavaScript and Python examples)</li>
            <li>• Heading, list, and paragraph detection</li>
            <li>• <strong>NEW:</strong> Section combination - select multiple sections and combine them</li>
            <li>• <strong>NEW:</strong> Section separation - split combined sections back apart</li>
          </ul>
        </div>
      </div>

      <CommentableDescription
        description={sampleDescription}
        title="AI Orchestrator System Prompt"
        className="border border-gray-200 rounded-lg p-6 bg-gray-50"
      />

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Usage Instructions:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li><strong>Commenting:</strong></li>
          <li>1. Click on any section of the text above to open the comment dialog</li>
          <li>2. Enter your name and comment in the dialog</li>
          <li>3. Click "Add Comment" to save your comment</li>
          <li>4. Sections with comments will have a blue background and show comment counts</li>
          <li className="mt-2"><strong>Section Management:</strong></li>
          <li>5. Click "Select Sections" to enter selection mode</li>
          <li>6. Click multiple sections to select them (they turn purple)</li>
          <li>7. Click "Combine" to merge selected sections into one block</li>
          <li>8. Click the orange "Separate" button on combined sections to split them back apart</li>
          <li>9. Use "Clear" to deselect all sections or "Exit Selection" to return to comment mode</li>
        </ol>
      </div>
    </div>
  );
}